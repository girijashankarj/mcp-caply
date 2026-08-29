# MCP Protocol Support

## Scope

Caply is an MCP client. Protocol-sensitive code must follow the official MCP specification rather than relying on assumptions from individual MCP servers.

Official reference: https://modelcontextprotocol.io/specification/

## Transport

The browser implementation targets **Streamable HTTP**.

The client sends JSON-RPC 2.0 messages using HTTP POST and accepts either JSON or `text/event-stream` responses.

## Initialization

The client starts with `initialize` and advertises the Caply client identity:

```json
{
  "clientInfo": {
    "name": "mcp-caply",
    "version": "0.1.0"
  },
  "capabilities": {}
}
```

The server's negotiated protocol version is then used for subsequent requests.

The implementation contains compatibility paths for multiple known protocol revisions. This is intentional because MCP servers in the ecosystem may not upgrade simultaneously.

## Capability discovery

Caply discovers the three user-facing MCP primitives:

```text
tools/list
resources/list
prompts/list
```

A server may support only a subset. An unsupported primitive is treated as unavailable rather than as a reason to fail the whole catalog.

## Tools

A tool exposes metadata and an input schema. Caply uses that schema to display the request structure.

Invocation uses:

```text
tools/call
```

The returned JSON-RPC envelope is retained so the user can inspect the actual protocol response.

## Resources

Resource discovery uses:

```text
resources/list
```

A resource can be read with:

```text
resources/read
```

## Prompts

Prompt discovery uses:

```text
prompts/list
```

Prompt retrieval uses:

```text
prompts/get
```

## Errors

JSON-RPC errors are not silently converted into model-generated explanations. Caply surfaces the server/protocol error so the user can inspect what happened.

## Protocol version policy

Protocol versions evolve. Caply should prefer the newest supported version and retain backwards-compatible handling where practical.

Before shipping a protocol-sensitive change, verify the current official specification and update the compatibility matrix and tests.

## Important distinction

MCP is a protocol layer. It is not a database, RAG implementation, LLM or authorization provider.

A RAG system can be exposed through an MCP server, but RAG and MCP remain separate architectural concepts.
