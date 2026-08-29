# Roadmap

## Phase 0 - Foundation

- [x] React + TypeScript + Vite application
- [x] GitHub Pages workflow
- [x] MCP client abstraction
- [x] Streamable HTTP request path
- [x] Tool/resource/prompt discovery model
- [x] Basic raw response display
- [x] Product/security documentation

## Phase 1 - Reliable MCP explorer

- [ ] Local deterministic Streamable HTTP test server
- [ ] Automated protocol tests
- [ ] Robust SSE handling for multi-message streams
- [ ] Pagination for list operations
- [ ] Capability-aware discovery
- [ ] Better JSON Schema form renderer
- [ ] Resource reader UI
- [ ] Prompt argument UI
- [ ] Clear protocol/error diagnostics

## Phase 2 - Daily developer utility

- [ ] Request history
- [ ] Save/replay with an explicit privacy model
- [ ] Copy request as JSON
- [ ] Copy response as JSON
- [ ] Search/filter tools
- [ ] Server metadata and connection health
- [ ] Response timing and request IDs

## Phase 3 - Authentication

- [ ] Generic credential abstraction
- [ ] OAuth support where browser-safe
- [ ] Per-server authentication configuration
- [ ] Credential lifecycle documentation
- [ ] Security review before persistent secrets

## Phase 4 - Browser compatibility expansion

- [ ] Optional local connector for non-browser-compatible MCP servers
- [ ] Local connector security model
- [ ] Local connector installation/update flow
- [ ] Clear direct-vs-local transport indicator

## Phase 5 - Ecosystem

- [ ] Import/export server profiles without secrets
- [ ] Shared request templates without credentials
- [ ] Community documentation/examples
- [ ] Optional MCP directory integration

## Explicitly not on the roadmap

- Built-in LLM chat
- Autonomous agent loops
- Central credential proxy
- Automatic interpretation of every MCP response
- Arbitrary local code execution

The product remains a direct MCP control surface.
