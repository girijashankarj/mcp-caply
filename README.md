# MCP Caply

**Your control panel for MCP. No model required.**

MCP Caply is an open-source, model-free MCP client for discovering and directly invoking MCP capabilities.

[Documentation](docs/README.md) · [Architecture](docs/ARCHITECTURE.md) · [Security](docs/SECURITY.md) · [Roadmap](docs/ROADMAP.md)

## Product thesis

**Connect → Discover → Understand → Execute → Inspect → Save → Replay.**

Caply puts the human directly in the MCP interaction loop. It does not require Claude, OpenAI, Gemini or another LLM at the consumer layer. The user selects the capability, provides the parameters and judges the returned evidence.

```text
                  MCP Caply
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      GitHub MCP   Slack MCP   Custom RAG MCP
          │           │           │
          └───────────┼───────────┘
                      ▼
                Human judgement
```

## Current V1

- Connect multiple MCP Streamable HTTP servers
- Discover tools, resources and prompts
- Render tool metadata and request schemas
- Execute tools manually
- Read resources and retrieve prompts through the client API
- Show raw JSON-RPC responses
- Browser-first credential handling with in-memory API keys
- GitHub Pages deployment

## Why model-free?

An AI assistant can translate natural language into tool calls and interpret the result. That is useful for delegation, but it is not always desirable.

Caply supports the direct path:

```text
Human → MCP capability → Raw/structured result → Human judgement
```

This removes mandatory model inference and reasoning cost from the consumer layer. It does **not** mean every MCP service is free. A server may require its own API plan, quota or enterprise licence.

## Security boundary

> **Server controls authority. Caply controls invocation. Human controls judgement.**

The MCP server controls authentication, authorization, scopes, key validity and exposed capabilities. Caply is responsible for secure protocol invocation and client-side credential handling.

The browser prototype does not persist API keys in localStorage and does not proxy credentials through a Caply backend.

See [docs/SECURITY.md](docs/SECURITY.md).

## Browser limitation

GitHub Pages is a static browser deployment. A remote MCP server must permit browser access, including the required CORS behaviour and a browser-compatible transport.

Caply intentionally does not add a central CORS/credential proxy just to bypass this boundary.

For servers that cannot be safely consumed from a browser, a future **optional local connector** may provide a local transport path. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Development

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Documentation

- [Documentation index](docs/README.md)
- [Product definition](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [MCP protocol support](docs/MCP-PROTOCOL.md)
- [Security model](docs/SECURITY.md)
- [Testing strategy](docs/TESTING.md)
- [Development guide](docs/DEVELOPMENT.md)
- [Roadmap](docs/ROADMAP.md)

## GitHub Pages

Deployment is defined in `.github/workflows/deploy.yml` and publishes the Vite `dist/` output through GitHub Pages.

Repository: https://github.com/girijashankarj/mcp-caply

## License

MIT. See [LICENSE](LICENSE).
