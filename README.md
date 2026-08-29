# MCP Caply

**Your control panel for MCP. No model required.**

MCP Caply is an open-source, model-free MCP client for discovering and directly invoking MCP capabilities.

## Product thesis

Connect → Discover → Understand → Execute → Inspect → Save → Replay.

Caply does not require Claude, OpenAI, Gemini or another LLM at the consumer layer. The user chooses the capability, provides the parameters and makes the judgement from the returned data.

## V1

- Connect multiple MCP servers
- Discover tools, resources and prompts
- Render capability metadata and request schemas
- Execute MCP operations
- Show structured and raw responses
- Save and replay requests
- Keep credentials out of source code and avoid localStorage for secrets
- GitHub Pages deployment

## Security boundary

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

## GitHub Pages

The repository includes a GitHub Actions workflow under `.github/workflows/deploy.yml` that builds the Vite application and deploys the `dist` directory to GitHub Pages.

Repository: https://github.com/girijashankarj/mcp-caply

## Important implementation note

The current UI establishes the product shell and connection workflow. The MCP transport adapter is intentionally the next implementation milestone. Browser-hosted clients can only connect to MCP servers whose transport, CORS policy and authentication flow permit browser access. We should not proxy arbitrary credentials through a third-party backend without an explicit security design.
