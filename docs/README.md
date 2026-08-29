# MCP Caply Documentation

MCP Caply is a browser-first, model-free MCP client. The `docs/` directory is the technical source of truth for product intent, architecture, security, protocol support and the delivery plan.

## Documents

- [Product](PRODUCT.md) - product thesis, target users, non-goals and V1 scope.
- [Architecture](ARCHITECTURE.md) - runtime architecture, browser constraints and component boundaries.
- [MCP Protocol](MCP-PROTOCOL.md) - supported MCP transport/protocol behaviour and compatibility policy.
- [Security](SECURITY.md) - credential handling, trust boundaries and browser security assumptions.
- [Testing](TESTING.md) - local validation, interoperability testing and release checks.
- [Roadmap](ROADMAP.md) - staged implementation plan and explicit future work.

## Design principle

> Server controls authority. Caply controls invocation. Human controls judgement.

Caply intentionally does not put an LLM or autonomous agent between the user and the MCP server.

## Source references

The implementation follows the MCP specification and TypeScript SDK documentation. The protocol evolves quickly, so protocol-sensitive implementation should always be checked against the current specification before release.

- https://modelcontextprotocol.io/
- https://ts.sdk.modelcontextprotocol.io/v2/
