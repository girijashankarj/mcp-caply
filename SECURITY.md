# Security Policy

## Scope

MCP Caply is a browser-first MCP client. Security issues involving credential handling, MCP request construction, cross-origin behaviour, response rendering or unintended local-machine authority are in scope.

## Do not report secrets in public issues

Never include API keys, OAuth tokens, cookies, credentials or private MCP responses in an issue or pull request.

## Current security model

- Credentials are not persisted by the browser prototype.
- Caply sends credentials directly to the configured MCP server.
- Caply does not provide a central credential proxy.
- Server authorization remains the MCP server's responsibility.
- Returned MCP content is treated as untrusted data.
- The application does not require arbitrary filesystem or shell permissions.

See [docs/SECURITY.md](docs/SECURITY.md) for the detailed model.

## Reporting

Until a dedicated private security contact is configured, do not publish exploitable credential or vulnerability details in a public issue. Contact the repository owner privately through the GitHub account associated with this project and provide a minimal reproducible description without secrets.
