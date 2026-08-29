# Development Guide

## Prerequisites

- Node.js 22 or newer
- npm
- A modern browser for the GitHub Pages client

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

## Build

```bash
npm run build
```

The production output is generated in `dist/`.

## Architecture locations

```text
src/
├── main.tsx          # React application and current UI orchestration
├── mcp/
│   └── client.ts     # MCP transport and protocol operations
└── styles.css        # UI system
```

## Implementation rules

1. Keep MCP protocol handling separate from UI components.
2. Do not add an LLM dependency to the core client.
3. Preserve raw JSON-RPC responses.
4. Do not persist credentials without a security review.
5. Do not put secrets into URLs, source control or debug logs.
6. Treat server-provided content as untrusted data.
7. Check the current MCP specification before changing protocol-sensitive code.
8. Prefer deterministic tests over live third-party dependencies.

## Adding a new MCP operation

1. Add a typed method to `src/mcp/client.ts`.
2. Preserve the raw JSON-RPC envelope.
3. Add unit/fixture coverage.
4. Add UI handling separately.
5. Document protocol behaviour in `docs/MCP-PROTOCOL.md`.
6. Verify browser compatibility if the operation is exposed from GitHub Pages.

## Pull request checklist

- [ ] Product scope is unchanged or explicitly documented.
- [ ] No LLM dependency was introduced.
- [ ] No credentials were committed.
- [ ] Protocol behaviour follows the current MCP specification.
- [ ] Tests/build pass.
- [ ] Security implications are documented.
- [ ] README/docs are updated when behaviour changes.
