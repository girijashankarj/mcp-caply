# Security Model

## Security philosophy

> Server controls authority. Caply controls invocation. Human controls judgement.

Caply is deliberately non-agentic. It should not need arbitrary filesystem, shell or code-execution authority to perform its core job.

## Trust boundaries

```text
User browser
   │
   │ credentials + MCP requests
   ▼
MCP server
   │
   ├── authentication
   ├── authorization
   ├── scopes
   ├── key validity
   └── exposed capabilities
```

The MCP server decides whether the credential is valid and what it is allowed to access.

Caply is responsible for making the request safely and protecting credentials while they are in the client.

## Credential handling

The current browser prototype:

- accepts a bearer API key as an input
- sends it directly to the configured MCP server
- does not commit it to source code
- does not put it into URL query parameters
- does not persist it in localStorage
- clears the input after a connection is established

The current implementation keeps the credential only within the active JavaScript runtime. This is a prototype policy, not a guarantee against a compromised browser environment.

## No shared credential proxy

Caply should not proxy arbitrary MCP credentials through a central Caply backend. Doing so would make Caply a high-value credential and data intermediary and would contradict the product's direct-consumption philosophy.

If a future relay is introduced for compatibility reasons, it must be a separate, explicitly opt-in architecture with a documented threat model.

## Browser CORS

A static browser application cannot bypass the MCP server's CORS policy. Users should connect only to MCP endpoints that explicitly permit browser access and whose origin policy is appropriate.

Do not add a CORS-bypass proxy merely to make an incompatible server appear to work.

## Untrusted MCP servers

An MCP server is an external trust boundary. Caply should treat returned content as untrusted data.

Do not execute returned content as JavaScript, shell commands or source code.

UI rendering must escape or safely render server-provided text.

## Logging

Do not log:

- API keys
- Authorization headers
- cookies
- OAuth tokens
- raw credentials

Raw MCP responses may contain sensitive business data. Debug logging of responses must therefore be explicit and disabled by default in production builds.

## Future security work

Before adding persistent credentials, OAuth flows, local connectors or request history, define:

1. Storage mechanism.
2. Encryption/key management approach.
3. Session lifecycle.
4. Logout/credential revocation behaviour.
5. Sensitive-data redaction policy.
6. Threat model and abuse cases.
7. Secure update and dependency policy.
