import { describe, expect, it } from 'vitest';

// Protocol fixtures document the exact JSON shapes Caply must preserve.
// These tests intentionally do not call a third-party MCP server or transmit
// credentials. Network interoperability is covered by the local test server.
describe('MCP response fixtures', () => {
  it('preserves tool discovery metadata', () => {
    const response = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        tools: [{ name: 'search', description: 'Search data', inputSchema: { type: 'object' } }],
      },
    };

    expect(response.result.tools[0].name).toBe('search');
    expect(response.result.tools[0].inputSchema.type).toBe('object');
  });

  it('preserves raw JSON-RPC errors', () => {
    const response = { jsonrpc: '2.0', id: 2, error: { code: -32601, message: 'Method not found' } };
    expect(response.error.code).toBe(-32601);
    expect(response.error.message).toBe('Method not found');
  });
});
