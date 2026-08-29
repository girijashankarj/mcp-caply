export type JsonRpcResponse = { jsonrpc: '2.0'; id?: number | string | null; result?: unknown; error?: { code: number; message: string; data?: unknown } };
export type McpTool = { name: string; title?: string; description?: string; inputSchema?: Record<string, unknown>; outputSchema?: Record<string, unknown> };
export type McpResource = { uri: string; name?: string; title?: string; description?: string; mimeType?: string };
export type McpPrompt = { name: string; title?: string; description?: string; arguments?: Array<{ name: string; description?: string; required?: boolean }> };
export type McpCatalog = { protocolVersion: string; serverInfo?: Record<string, unknown>; capabilities?: Record<string, unknown>; tools: McpTool[]; resources: McpResource[]; prompts: McpPrompt[] };
export type McpCallResult = { raw: JsonRpcResponse; result: unknown };

const CLIENT_INFO = { name: 'mcp-caply', version: '0.1.0' };
const PROTOCOL_VERSIONS = ['2026-07-28', '2025-11-25', '2025-06-18', '2025-03-26'];

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
    // Session IDs existed in earlier Streamable HTTP revisions only.
    if (this.legacySessionId) headers['Mcp-Session-Id'] = this.legacySessionId;
    return headers;
  }

  private async parseResponse(response: Response): Promise<JsonRpcResponse> {
    const text = await response.text();
    if (!text.trim()) throw new Error(`MCP server returned an empty response (${response.status}).`);
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/event-stream')) {
      const data = text.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).filter(Boolean).pop();
      if (!data) throw new Error('MCP SSE response contained no data event.');
      return JSON.parse(data) as JsonRpcResponse;
    }
    return JSON.parse(text) as JsonRpcResponse;
  }

  private async request(method: string, params: Record<string, unknown> = {}): Promise<JsonRpcResponse> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ jsonrpc: '2.0', id: ++this.id, method, params }),
    });
    const session = response.headers.get('Mcp-Session-Id');
    if (session && this.protocolVersion !== '2026-07-28') this.legacySessionId = session;
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`MCP HTTP ${response.status}: ${detail || response.statusText}`);
    }
    const rpc = await this.parseResponse(response);
    if (rpc.error) throw new Error(`MCP ${rpc.error.code}: ${rpc.error.message}`);
    return rpc;
  }

  private async notify(method: string): Promise<void> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ jsonrpc: '2.0', method }),
    });
    if (!response.ok && response.status !== 202) throw new Error(`MCP notification HTTP ${response.status}`);
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
        this.protocolVersion = String(result.protocolVersion ?? version);
        // Required by older revisions. The current 2026-07-28 revision is
        // stateless and removes protocol-level sessions, so skip it there.
        if (this.protocolVersion !== '2026-07-28') await this.notify('notifications/initialized');
        return this.loadCatalog(result);
      } catch (error) {
        lastError = error;
      }
    }
    throw new Error(`MCP initialization failed: ${String(lastError)}`);
  }

  private async loadCatalog(initialResult: Record<string, unknown>): Promise<McpCatalog> {
    const [tools, resources, prompts] = await Promise.all([
      this.list<McpTool>('tools/list', 'tools'),
      this.list<McpResource>('resources/list', 'resources'),
      this.list<McpPrompt>('prompts/list', 'prompts'),
    ]);
    return {
      protocolVersion: this.protocolVersion,
      serverInfo: initialResult.serverInfo as Record<string, unknown> | undefined,
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
