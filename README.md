# MCP Caply

**Your control panel for MCP. No model required.**

> **Preview MCP capabilities before you use them.** Connect to an MCP server, discover its tools, resources, prompts and other capabilities, inspect their schemas and metadata, and test them directly before trusting them in an AI client.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-MCP%20Caply-111827?style=for-the-badge)](https://girijashankarj.github.io/mcp-caply/)

## Live Demo

**[Open MCP Caply →](https://girijashankarj.github.io/mcp-caply/)**

MCP Caply is an open-source, model-free MCP client for discovering, understanding and directly invoking MCP capabilities.

### Why Caply?

**Preview first. Use later.**

Before connecting an MCP server to Claude, ChatGPT, Cursor or another AI client, Caply lets a human inspect what the server exposes and understand what will actually be available.

**Connect → Discover → Preview → Understand → Execute → Inspect → Save → Replay**

You can explore:

- **Tools**: names, descriptions, input schemas and execution results
- **Resources**: available URIs, metadata and resource content
- **Prompts**: prompt templates, arguments and generated messages
- **Server capabilities**: what the MCP server actually declares
- **Responses**: structured and raw results for human inspection

Caply does not require Claude, OpenAI, Gemini or another LLM at the consumer layer. The user chooses the capability, provides the parameters and makes the judgement from the returned data.

## Product thesis

AI assistants are useful when you want natural-language delegation. Caply targets the different case: **direct human control over MCP capabilities before they become part of an AI workflow.**

```text
Human
  ↓
MCP Caply
  ↓
MCP Server
  ↓
Tools / Resources / Prompts
  ↓
Preview / Execute / Inspect
  ↓
Human judgement
```

## V1

- Connect multiple MCP servers
- Discover tools, resources and prompts
- Preview capability metadata and request schemas
- Execute MCP operations directly
- Show structured and raw responses
- Keep credentials out of source code and avoid localStorage for secrets
- GitHub Pages deployment

## Architecture

```text
                     MCP Caply
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      GitHub MCP      Slack MCP     Custom RAG MCP
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                       Human
```

Caply does not need to understand the internal implementation of each server. It consumes the MCP protocol and dynamically discovers declared capabilities.

## Security boundary

**Server controls authority. Caply controls invocation. Human controls judgement.**

MCP server owners control authentication, authorization, scopes, key validity and exposed capabilities. Caply is responsible for securely invoking the MCP protocol and protecting credentials on the client side.

The project is deliberately non-agentic. It does not need arbitrary local filesystem access, shell execution or autonomous model-driven actions.

## Development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Documentation

- [Product](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [MCP Protocol](docs/MCP-PROTOCOL.md)
- [Security](docs/SECURITY.md)
- [Testing](docs/TESTING.md)
- [Development](docs/DEVELOPMENT.md)
- [Roadmap](docs/ROADMAP.md)
- [Contributing](CONTRIBUTING.md)

## GitHub Pages

The repository includes a GitHub Actions workflow under `.github/workflows/deploy.yml` that builds the Vite application and deploys the `dist` directory to GitHub Pages.

Repository: https://github.com/girijashankarj/mcp-caply

## Important implementation note

The GitHub Pages deployment is a static browser client. An MCP server must permit browser access for direct connection. Servers that require non-browser transports or restrictive CORS will need the future optional local connector described in the roadmap.

## License

MIT. See [LICENSE](LICENSE).
