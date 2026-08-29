export type JsonRpcResponse = { jsonrpc: '2.0'; id?: number | string | null; result?: unknown; error?: { code: number; message: string; data?: unknown } };
export type McpTool = { name: string; title?: string; description?: string; inputSchema?: Record<string, unknown>; outputSchema?: Record<string, unknown> };
export type McpResource = { uri: string; name?: string; title?: string; description?: string; mimeType?: string };
export type McpPrompt = { name: string; title?: string; description?: string; arguments?: Array<{ name: string; description?: string; required?: boolean }> };
export type McpCatalog = { protocolVersion: string; serverInfo?: Record<string, unknown>; capabilities?: Record<string, unknown>; tools: McpTool[]; resources: McpResource[]; prompts: McpPrompt[] };
export type McpCallResult = { raw: JsonRpcResponse; result: unknown };

const CLIENT_INFO = { name: 'mcp-caply', version: '0.1.0' };
const LEGACY_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];
const MODERN_VERSION = '2026-07-28';

type Era = 'modern' | 'legacy';

/** Direct MCP Streamable HTTP client. No model or agent layer. */
export class McpHttpClient {
  private id = 0;
  private era: Era = 'legacy';
  private protocolVersion = LEGACY_VERSIONS[0];
  private legacySessionId?: string;

  constructor(private readonly url: string, private readonly apiKey?: string) {}

  private headers(method: string, name?: string): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
    };

    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    if (this.era === 'modern') {
      headers['MCP-Protocol-Version'] = MODERN_VERSION;
      headers['Mcp-Method'] = method;
      if (name) headers['Mcp-Name'] = name;
    } else {
      headers['MCP-Protocol-Version'] = this.protocolVersion;
      if (this.legacySessionId) headers['Mcp-Session-Id'] = this.legacySessionId;
    }

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
      if (!data) throw new Error('MCP SSE response contained no data event.');
      return JSON.parse(data) as JsonRpcResponse;
    }

    return JSON.parse(text) as JsonRpcResponse;
  }

  private async request(method: string, params: Record<string, unknown> = {}, name?: string): Promise<JsonRpcResponse> {
    const body = {
      jsonrpc: '2.0',
      id: ++this.id,
      method,
      params: this.era === 'modern'
        ? { ...params, _meta: { 'io.modelcontextprotocol/protocolVersion': MODERN_VERSION, 'io.modelcontextprotocol/clientCapabilities': {}, 'io.modelcontextprotocol/clientInfo': CLIENT_INFO } }
        : params,
    };

    let response: Response;
    try {
      response = await fetch(this.url, { method: 'POST', headers: this.headers(method, name), body: JSON.stringify(body) });
    } catch {
      throw new Error('Network request failed. Check the MCP URL and whether the server allows browser CORS from https://girijashankarj.github.io.');
    }

    const session = response.headers.get('Mcp-Session-Id');
    if (session && this.era === 'legacy') this.legacySessionId = session;

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`MCP HTTP ${response.status}: ${detail || response.statusText}`);
    }

    const rpc = await this.parseResponse(response);
    if (rpc.error) throw new Error(`MCP ${rpc.error.code}: ${rpc.error.message}`);
    return rpc;
  }

  private async notifyInitialized(): Promise<void> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: this.headers('notifications/initialized'),
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }),
    });
    if (!response.ok && response.status !== 202) throw new Error(`MCP initialized notification failed (HTTP ${response.status}).`);
  }

  async connect(): Promise<McpCatalog> {
    // MCP 2026-07-28 removed initialize/session and introduced server/discover.
    // Probe that era first, then fall back to the 2025 initialize handshake.
    try {
      this.era = 'modern';
      this.protocolVersion = MODERN_VERSION;
      this.legacySessionId = undefined;
      const response = await this.request('server/discover');
      const result = (response.result ?? {}) as Record<string, unknown>;
      const serverInfo = (result._meta as Record<string, unknown> | undefined)?.['io.modelcontextprotocol/serverInfo'] as Record<string, unknown> | undefined;
      return this.loadCatalog(result, serverInfo);
    } catch (modernError) {
      this.era = 'legacy';
      this.legacySessionId = undefined;

      let lastError: unknown = modernError;
      for (const version of LEGACY_VERSIONS) {
        this.protocolVersion = version;
        try {
          const response = await this.request('initialize', {
            protocolVersion: version,
            capabilities: {},
            clientInfo: CLIENT_INFO,
          });
          const result = (response.result ?? {}) as Record<string, unknown>;
          const negotiated = String(result.protocolVersion ?? version);
          if (!LEGACY_VERSIONS.includes(negotiated)) throw new Error(`Server negotiated unsupported protocol version ${negotiated}.`);
          this.protocolVersion = negotiated;
          await this.notifyInitialized();
          return this.loadCatalog(result, result.serverInfo as Record<string, unknown> | undefined);
        } catch (error) {
          lastError = error;
        }
      }

      throw new Error(`Could not connect to MCP server. ${String(lastError)}`);
    }
  }

  private async loadCatalog(initialResult: Record<string, unknown>, serverInfo?: Record<string, unknown>): Promise<McpCatalog> {
    const [tools, resources, prompts] = await Promise.all([
      this.list<McpTool>('tools/list', 'tools'),
      this.list<McpResource>('resources/list', 'resources'),
      this.list<McpPrompt>('prompts/list', 'prompts'),
    ]);
    return {
      protocolVersion: this.protocolVersion,
      serverInfo,
      capabilities: initialResult.capabilities as Record<string, unknown> | undefined,
      tools,
      resources,
      prompts,
    };
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
    const raw = await this.request('tools/call', { name, arguments: arguments_ }, name);
    return { raw, result: raw.result };
  }

  async readResource(uri: string): Promise<McpCallResult> {
    const raw = await this.request('resources/read', { uri }, uri);
    return { raw, result: raw.result };
  }

  async getPrompt(name: string, arguments_: Record<string, string> = {}): Promise<McpCallResult> {
    const raw = await this.request('prompts/get', { name, arguments: arguments_ }, name);
    return { raw, result: raw.result };
  }
}
