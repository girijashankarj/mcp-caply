export type JsonRpcResponse = {
  jsonrpc: '2.0';
  id?: number | string | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

export type McpTool = {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
};

export type McpResource = {
  uri: string;
  name?: string;
  title?: string;
  description?: string;
  mimeType?: string;
};

export type McpPrompt = {
  name: string;
  title?: string;
  description?: string;
  arguments?: Array<{ name: string; description?: string; required?: boolean }>;
};

export type McpCatalog = {
  protocolVersion: string;
  serverInfo?: Record<string, unknown>;
  capabilities?: Record<string, unknown>;
  tools: McpTool[];
  resources: McpResource[];
  prompts: McpPrompt[];
};

export type McpCallResult = {
  raw: unknown;
  result: unknown;
};

const CLIENT_INFO = {
  name: 'mcp-caply',
  version: '0.1.0',
};

/**
 * Minimal browser MCP client for remote Streamable HTTP servers.
 *
 * We intentionally do not hide protocol responses behind an LLM. The client
 * returns the raw JSON-RPC result so the UI can expose exactly what the server
 * returned.
 */
export class McpHttpClient {
  private id = 0;
  private sessionId?: string;
  private protocolVersion = '2025-11-25';
  private modern = false;

  constructor(private readonly url: string, private readonly apiKey?: string) {}

  private headers(method: string, name?: string): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
    };

    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    // 2026-07-28 stateless Streamable HTTP routing headers.
    if (this.modern) {
      headers['MCP-Protocol-Version'] = '2026-07-28';
      headers['Mcp-Method'] = method;
      if (name) headers['Mcp-Name'] = name;
    }

    if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;
    return headers;
  }

  private async parseResponse(response: Response): Promise<JsonRpcResponse> {
    const text = await response.text();
    if (!text.trim()) throw new Error(`MCP server returned an empty response (${response.status}).`);

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/event-stream')) {
      // Streamable HTTP may return JSON-RPC messages as SSE data events.
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
      params,
    };

    const response = await fetch(this.url, {
      method: 'POST',
      headers: this.headers(method, name),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`MCP HTTP ${response.status}: ${detail || response.statusText}`);
    }

    const rpc = await this.parseResponse(response);
    if (rpc.error) throw new Error(`MCP ${rpc.error.code}: ${rpc.error.message}`);
    return rpc;
  }

  async connect(): Promise<McpCatalog> {
    // Current 2026-07-28 servers use stateless requests with explicit headers.
    // We first attempt the current protocol, then fall back to the 2025
    // initialize handshake for servers that still implement the previous spec.
    this.modern = true;
    try {
      const response = await this.request('server/discover');
      const result = (response.result ?? {}) as Record<string, unknown>;
      this.protocolVersion = String(result.protocolVersion ?? '2026-07-28');
      return this.loadCatalog(result);
    } catch (modernError) {
      this.modern = false;
      this.sessionId = undefined;

      try {
        const response = await this.request('initialize', {
          protocolVersion: this.protocolVersion,
          capabilities: {},
          clientInfo: CLIENT_INFO,
        });
        const result = (response.result ?? {}) as Record<string, unknown>;
        this.protocolVersion = String(result.protocolVersion ?? this.protocolVersion);
        this.sessionId = undefined;
        return this.loadCatalog(result);
      } catch (legacyError) {
        throw new Error(`Could not connect using MCP Streamable HTTP. Modern: ${String(modernError)}. Legacy: ${String(legacyError)}`);
      }
    }
  }

  private async loadCatalog(initialResult: Record<string, unknown>): Promise<McpCatalog> {
    const [tools, resources, prompts] = await Promise.all([
      this.list<McpTool>('tools/list'),
      this.list<McpResource>('resources/list'),
      this.list<McpPrompt>('prompts/list'),
    ]);

    return {
      protocolVersion: this.protocolVersion,
      serverInfo: (initialResult.serverInfo as Record<string, unknown> | undefined),
      capabilities: (initialResult.capabilities as Record<string, unknown> | undefined),
      tools,
      resources,
      prompts,
    };
  }

  private async list<T>(method: 'tools/list' | 'resources/list' | 'prompts/list'): Promise<T[]> {
    try {
      const response = await this.request(method);
      const result = (response.result ?? {}) as Record<string, unknown>;
      const key = method.split('/')[0];
      return Array.isArray(result[key]) ? result[key] as T[] : [];
    } catch (error) {
      // A server may legitimately omit a primitive. Treat method-not-found as
      // an empty collection so one unsupported primitive does not block discovery.
      if (String(error).includes('-32601') || String(error).includes('Method not found')) return [];
      throw error;
    }
  }

  async callTool(name: string, arguments_: Record<string, unknown>): Promise<McpCallResult> {
    const response = await this.request('tools/call', { name, arguments: arguments_ }, name);
    return { raw: response, result: response.result };
  }

  async readResource(uri: string): Promise<McpCallResult> {
    const response = await this.request('resources/read', { uri }, uri);
    return { raw: response, result: response.result };
  }

  async getPrompt(name: string, arguments_: Record<string, string> = {}): Promise<McpCallResult> {
    const response = await this.request('prompts/get', { name, arguments: arguments_ }, name);
    return { raw: response, result: response.result };
  }
}
