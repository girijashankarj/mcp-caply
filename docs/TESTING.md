# Testing Strategy

## Goals

Tests should prove that Caply:

- speaks MCP correctly
- preserves server responses
- handles protocol errors predictably
- does not require an LLM
- does not leak credentials
- works with real MCP servers where browser policy permits it

## Test layers

### 1. Unit tests

Cover:

- JSON-RPC request construction
- protocol-version negotiation
- response parsing
- SSE parsing
- error handling
- schema extraction
- tool/resource/prompt mapping

### 2. Local MCP fixture server

Use a deterministic local Streamable HTTP MCP server for automated tests.

It should expose at least:

```text
tools/list
resources/list
prompts/list
tools/call
resources/read
prompts/get
```

It should also return controlled JSON-RPC errors and malformed responses for negative tests.

### 3. Browser integration tests

Verify:

```text
Add server
  ↓
Connect
  ↓
Discover
  ↓
Select tool
  ↓
Enter arguments
  ↓
Execute
  ↓
Inspect raw response
```

### 4. Real-server interoperability

Use a public MCP server only when its documentation explicitly permits browser access.

The test should record:

- server URL
- transport
- protocol version
- whether authentication is required
- CORS result
- discovery result
- tool execution result

Never commit production credentials.

## GitHub Pages test

After deployment:

1. Open the Pages URL.
2. Add a known browser-compatible MCP endpoint.
3. Connect without exposing credentials in screenshots or logs.
4. Confirm tools/resources/prompts are discovered.
5. Execute a harmless read-only tool.
6. Inspect the raw JSON-RPC response.
7. Confirm browser console contains no credential leakage.

## Release gate

A release is not complete until:

- TypeScript build succeeds.
- Unit tests pass.
- Local MCP fixture tests pass.
- GitHub Pages build succeeds.
- At least one documented real-server interoperability test succeeds, or a documented CORS/transport limitation is recorded.

## Important limitation

A successful server-to-server curl test does not prove browser compatibility. CORS, browser transport restrictions and authentication behaviour must be tested from the deployed browser application itself.
