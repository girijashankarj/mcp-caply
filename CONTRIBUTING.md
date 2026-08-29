# Contributing to MCP Caply

Thanks for contributing.

## Before you start

Read:

- `README.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/MCP-PROTOCOL.md`

## Scope

Contributions should strengthen Caply as a direct MCP client. Avoid adding an LLM or autonomous agent behaviour to the core application unless the product direction is explicitly changed.

## Development

```bash
npm install
npm run dev
npm run build
```

## Pull requests

Keep pull requests focused. Include tests for protocol changes and update documentation when behaviour or security assumptions change.

Do not commit:

- API keys
- OAuth tokens
- private MCP URLs
- production data
- generated secrets

## Protocol changes

MCP is an evolving protocol. Link the relevant official specification section in the PR description when changing transport, initialization, capability discovery or invocation behaviour.

## Security

For security-sensitive issues, follow `SECURITY.md` instead of opening a public issue with exploitable details.
