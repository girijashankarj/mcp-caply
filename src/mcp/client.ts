export type JsonRpcResponse = { jsonrpc: '2.0'; id?: number | string | null; result?: unknown; error?: { code: number; message: string; data?: unknown } };
export type McpTool = { name: string; title?: string; description?: string; inputSchema?: Record<string, unknown>; outputSchema?: Record<string, unknown> };
export type McpResource = { uri: string; name?: string; title?: string; description?: string; mimeType?: string };
export type McpPrompt = { name: string; title?: string; description?: string; arguments?: Array<{ name: string; description?: string; required?: boolean }> };
export type McpCatalog = { protocolVersion: string; serverInfo?: Record<string, unknown>; capabilities?: Record<string, unknown>; tools: McpTool[]; resources: McpResource[]; prompts: McpPrompt[] };
export type McpCallResult = { raw: JsonRpcResponse; result: unknown };
export type DiagnosticStatus = 'pass' | 'warn' | 'fail';
export type DiagnosticCheck = { name: string; status: DiagnosticStatus; detail: string };

const CLIENT_INFO = { name: 'mcp-caply', version: '0.1.0' };
const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];
const REQUEST_TIMEOUT_MS = 30_000;

/** Direct MCP Streamable HTTP client. No model or agent layer. */
export class McpHttpClient {
  private id = 0;
  private protocolVersion = PROTOCOL_VERSIONS[0];
  private legacySessionId?: string;

  constructor(private readonly url: string, private readonly apiKey?: string) {}

  private headers(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
      'MCP-Protocol-Version': this.protocolVersion,
    };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    if (this.legacySessionId) headers['Mcp-Session-Id'] = this.legacySessionId;
    return headers;
  }

  private async parseResponse(response: Response): Promise<JsonRpcResponse> {
    const text = await response.text();
    if (!text.trim()) throw new Error(`MCP server returned an empty response (HTTP ${response.status}).`);
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('text/event-stream')) {
      const data = text
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .filter(Boolean)
        .pop();
      if (!data) throw new Error('MCP SSE response contained no JSON-RPC data event.');
      return JSON.parse(data) as JsonRpcResponse;
    }

    return JSON.parse(text) as JsonRpcResponse;
  }

  private async request(method: string, params: Record<string, unknown> = {}): Promise<JsonRpcResponse> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ jsonrpc: '2.0', id: ++this.id, method, params }),
        signal: controller.signal,
      });

      const session = response.headers.get('Mcp-Session-Id');
      if (session) this.legacySessionId = session;

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`MCP HTTP ${response.status}: ${detail || response.statusText}`);
      }

      const rpc = await this.parseResponse(response);
      if (rpc.error) throw new Error(`MCP ${rpc.error.code}: ${rpc.error.message}`);
      return rpc;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`MCP request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`);
      }
      if (error instanceof TypeError) {
        throw new Error('Browser could not reach this MCP endpoint. This is usually CORS, network, HTTPS, or authentication configuration.');
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  private async notifyInitialized(): Promise<void> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }),
        signal: controller.signal,
      });
      if (!response.ok && response.status !== 202) throw new Error(`MCP initialized notification failed (HTTP ${response.status}).`);
    } catch (error) {
      if (error instanceof TypeError) throw new Error('Browser could not send the MCP initialized notification. Check server CORS policy.');
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  /** Browser-safe diagnostics. CORS can prevent JavaScript from seeing the actual HTTP response. */
  async diagnose(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = [];
    let parsed: URL;

    try {
      parsed = new URL(this.url);
      checks.push({ name: 'URL', status: parsed.protocol === 'https:' || parsed.hostname === 'localhost' ? 'pass' : 'warn', detail: parsed.href });
    } catch {
      return [{ name: 'URL', status: 'fail', detail: 'Invalid URL. Use an absolute http(s) MCP endpoint.' }];
    }

    try {
      const response = await fetch(parsed.href, { method: 'GET', headers: { Accept: 'text/event-stream, application/json' }, signal: AbortSignal.timeout(8_000) });
      checks.push({ name: 'Endpoint reachability', status: response.status < 500 ? 'pass' : 'fail', detail: `GET returned HTTP ${response.status}. A 405 can be valid for an MCP endpoint that only accepts POST.` });
      const allowOrigin = response.headers.get('access-control-allow-origin');
      checks.push({ name: 'CORS response header', status: allowOrigin ? 'pass' : 'warn', detail: allowOrigin ? `Access-Control-Allow-Origin: ${allowOrigin}` : 'Header not visible to the browser. POST requests with custom MCP headers may still be blocked.' });
    } catch (error) {
      checks.push({ name: 'Endpoint reachability', status: 'fail', detail: error instanceof DOMException && error.name === 'AbortError' ? 'GET timed out after 8 seconds.' : 'Browser could not read the endpoint. This is commonly CORS, DNS, TLS, network, or server availability.' });
      checks.push({ name: 'CORS', status: 'fail', detail: 'The browser could not complete a cross-origin request. Check Access-Control-Allow-Origin and allowed request headers on the MCP server.' });
    }

    if (this.apiKey) {
      checks.push({ name: 'Authentication', status: 'warn', detail: 'Bearer authentication is configured. The server must allow the Authorization header in CORS preflight.' });
    } else {
      checks.push({ name: 'Authentication', status: 'warn', detail: 'No bearer API key configured. Continue only if this MCP server is intentionally unauthenticated.' });
    }

    checks.push({ name: 'MCP transport', status: 'warn', detail: 'Caply uses Streamable HTTP POST with JSON-RPC and the MCP-Protocol-Version header.' });
    return checks;
  }

  async connect(): Promise<McpCatalog> {
    let lastError: unknown;

    for (const version of PROTOCOL_VERSIONS) {
      this.protocolVersion = version;
      this.legacySessionId = undefined;
      try {
        const response = await this.request('initialize', {
          protocolVersion: version,
          capabilities: {},
          clientInfo: CLIENT_INFO,
        });
        const result = (response.result ?? {}) as Record<string, unknown>;
        const negotiated = String(result.protocolVersion ?? version);

        if (!PROTOCOL_VERSIONS.includes(negotiated)) throw new Error(`Server negotiated unsupported MCP protocol version ${negotiated}.`);
        this.protocolVersion = negotiated;
        await this.notifyInitialized();
        return this.loadCatalog(result);
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(`Could not connect to MCP server. ${String(lastError)}`);
  }

  private async loadCatalog(initialResult: Record<string, unknown>): Promise<McpCatalog> {
    const [tools, resources, prompts] = await Promise.all([
      this.list<McpTool>('tools/list', 'tools'),
      this.list<McpResource>('resources/list', 'resources'),
      this.list<McpPrompt>('prompts/list', 'prompts'),
    ]);
    return { protocolVersion: this.protocolVersion, serverInfo: initialResult.serverInfo as Record<string, unknown> | undefined, capabilities: initialResult.capabilities as Record<string, unknown> | undefined, tools, resources, prompts };
  }

  private async list<T>(method: 'tools/list' | 'resources/list' | 'prompts/list', key: 'tools' | 'resources' | 'prompts'): Promise<T[]> {
    try {
      const response = await this.request(method);
      const result = (response.result ?? {}) as Record<string, unknown>;
      return Array.isArray(result[key]) ? result[key] as T[] : [];
    } catch (error) {
      if (String(error).includes('-32601') || String(error).includes('Method not found')) return [];
      throw error;
    }
  }

  async callTool(name: string, arguments_: Record<string, unknown>): Promise<McpCallResult> {
    const raw = await this.request('tools/call', { name, arguments: arguments_ });
    return { raw, result: raw.result };
  }

  async readResource(uri: string): Promise<McpCallResult> {
    const raw = await this.request('resources/read', { uri });
    return { raw, result: raw.result };
  }

  async getPrompt(name: string, arguments_: Record<string, string> = {}): Promise<McpCallResult> {
    const raw = await this.request('prompts/get', { name, arguments: arguments_ });
    return { raw, result: raw.result };
  }
}
