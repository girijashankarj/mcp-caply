# MCP Caply Product

## One sentence

**MCP Caply is a model-free control panel for connecting, discovering and directly invoking MCP capabilities.**

## Product thesis

Connect → Discover → Understand → Execute → Inspect → Save → Replay.

The user should be able to connect an MCP server, discover its tools/resources/prompts, understand request schemas, invoke a capability and inspect what the server actually returned without requiring an LLM at the consumer layer.

## Why it exists

AI assistants add a reasoning and interpretation layer between a person and external capabilities. That is useful when the user wants natural-language delegation. It is unnecessary when the user wants direct control, deterministic invocation and raw evidence.

Caply targets the second workflow.

## Target users

- MCP server developers
- Backend and platform engineers
- QA and integration engineers
- Security-conscious technical users
- Enterprise engineers working with multiple MCP servers
- Developers who want to inspect MCP behaviour without consuming an AI model

## Core use cases

### 1. Capability discovery

Connect an MCP server and immediately see its advertised tools, resources and prompts.

### 2. Tool execution

Select a tool, inspect its input schema, provide parameters and call it directly.

### 3. Raw protocol inspection

Show the returned JSON-RPC payload rather than hiding it behind model-generated prose.

### 4. Multi-server workspace

Keep several MCP servers available from one client, regardless of whether they are commercial, community, private or self-hosted.

### 5. MCP development/debugging

Use Caply as a lightweight workbench for understanding what an MCP server actually exposes and returns.

## Non-goals

Caply is not intended to be:

- an AI chatbot
- an LLM provider
- an autonomous coding agent
- a general-purpose local shell or filesystem agent
- a central credential proxy
- an MCP marketplace
- a replacement for the MCP server's own authorization system

## V1 scope

1. Add an MCP Streamable HTTP server.
2. Discover tools, resources and prompts.
3. Display tool metadata and request schemas.
4. Execute tools manually.
5. Read resources manually.
6. Retrieve prompts manually.
7. Display structured and raw results.
8. Keep credentials in memory only in the browser prototype.
9. Support multiple configured server entries during the session.
10. Deploy the static client to GitHub Pages.

Save/replay is a product requirement, but persistent request storage should be implemented only after its credential and privacy model is explicitly designed.

## Product principle

> No model is required to consume an MCP capability.

This does not claim MCP services are free. A server can require paid access, API quotas or enterprise licensing. Caply simply does not add a mandatory LLM inference layer.
