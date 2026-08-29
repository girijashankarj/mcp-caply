# MCP Caply Architecture

## Overview

Caply is a browser-first MCP client. The core path is:

```text
User
  │
  ▼
React UI
  │
  ▼
MCP HTTP client
  │
  ▼
Streamable HTTP MCP server
  │
  ├── Tools
  ├── Resources
  └── Prompts
```

There is no LLM in the request path.

## Runtime components

### UI

React + TypeScript renders servers, capability lists, schemas, inputs and results.

### MCP client

`src/mcp/client.ts` owns JSON-RPC request construction, Streamable HTTP transport, protocol-version negotiation, response parsing and MCP operations.

### Server

The remote MCP server owns its internal implementation, authentication model, authorization, scopes and exposed capabilities.

## Connection lifecycle

```text
User enters URL + credential
        │
        ▼
HTTP MCP initialize
        │
        ▼
Server returns negotiated protocol version
        │
        ▼
Discover tools/list
resources/list
prompts/list
        │
        ▼
Render capability catalog
```

For older MCP protocol revisions, the client also handles the initialization notification and legacy session identifier where required.

## Invocation lifecycle

```text
User selects capability
        │
        ▼
Schema rendered by Caply
        │
        ▼
User enters arguments
        │
        ▼
JSON-RPC request
        │
        ▼
MCP server
        │
        ▼
Raw JSON-RPC response
        │
        ▼
Caply displays result
```

The raw response remains available because transparency is a core product requirement.

## Browser constraint

GitHub Pages hosts only static frontend assets. A browser can directly call an MCP server only when the server's transport and browser security policy permit that request, including appropriate CORS behaviour.

Caply must not introduce a shared backend proxy simply to bypass CORS because that would create a central credential and data trust boundary.

A future optional local connector may support MCP servers that cannot safely be consumed directly from a browser. That connector must be opt-in and local to the user's machine.

## Multi-server model

Each server is an independent connection boundary:

```text
Caply
 ├── GitHub MCP
 ├── Slack MCP
 ├── Jira MCP
 ├── Company RAG MCP
 └── Self-hosted MCP
```

Caply does not need to understand each server's business logic. It consumes the standard MCP interface and dynamically renders the declared capabilities.

## Persistence

The current browser prototype deliberately avoids persistent secret storage. Server credentials are held in memory for the active session.

Persistent server profiles and request history require a separate threat model before implementation.
