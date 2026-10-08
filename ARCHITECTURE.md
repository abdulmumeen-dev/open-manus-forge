# Architecture

## Design principles

1. **Local-first, provider-neutral.** A user can run the core with Ollama, llama.cpp, LM Studio, or a compatible hosted endpoint.
2. **One runtime, many clients.** Desktop, CLI, web, and integrations call the same local API.
3. **Explicit permissions.** Tools declare capabilities; policies decide whether they are allowed; approvals protect consequential actions.
4. **Progressive disclosure.** Skills expose metadata first and load detailed instructions only when relevant.
5. **Reproducible events.** Agent actions, tool calls, approvals, and results are recorded as an event stream.
6. **Community-safe by default.** Community skills and connectors are untrusted until reviewed and enabled.

## Core modules

### Model adapter

The adapter normalizes chat requests across providers. It should support:

- chat completion and streaming;
- tool/function calling;
- JSON-schema output;
- context and capability metadata;
- cancellation and timeouts;
- local endpoints with no API key;
- provider-specific diagnostics.

The initial implementation is intentionally small. Production work should add streaming, retries, structured tool-call validation, and model capability probing.

### Agent runtime

The agent loop should be explicit rather than hidden:

```text
observe -> plan -> request model -> validate tool call -> approval/policy -> execute -> record -> verify -> respond
```

Agent modes should include:

- **Ask:** answer without tools unless needed.
- **Plan:** inspect and propose read-only steps.
- **Act:** execute approved tools.
- **Autonomous:** continue within a declared budget and policy.
- **Review:** inspect a proposed patch, report, or workflow without changing the workspace.

### Skills

A skill is a directory containing `SKILL.md` with frontmatter:

```yaml
name: example-skill
description: Explain when the skill applies.
permissions:
  - filesystem.read
  - network.fetch
risk: low
```

The loader should support user, project, plugin, and built-in scopes. Skill scripts are never trusted solely because they are in a skill directory.

### Connectors

Connectors are adapters for MCP, HTTP APIs, local processes, and file systems. Each connector must declare:

- capabilities;
- required secrets;
- network destinations;
- whether it can mutate data;
- whether it supports dry-run;
- approval level;
- data retention behavior.

### Desktop

The desktop app should be a thin shell around the local API. It should not duplicate provider keys, agent logic, or connector execution. The recommended initial path is Tauri for a smaller native binary, with Electron as a fallback for faster multi-platform UI iteration.

Desktop milestones:

1. system tray + local server lifecycle;
2. chat and event timeline;
3. model/endpoint settings;
4. skills and connector manager;
5. approval prompts;
6. workspace picker;
7. packaged installers and auto-update only after the security model is mature.

## Data and privacy

- Secrets live in the OS keychain or a user-provided environment file, never in skill text or chat logs.
- Events should record tool names, inputs after redaction, approvals, and outputs with configurable retention.
- Local mode should work without a community registry.
- Telemetry must be opt-in and disabled by default.

## Phased implementation

### Phase 1 — foundation

- TypeScript core and HTTP server.
- Provider registry and health checks.
- Skills and connector metadata.
- Policy and approval types.
- Tests for registry and policy behavior.

### Phase 2 — useful local agent

- Ollama and OpenAI-compatible adapters.
- Streaming responses.
- File tools with workspace boundary.
- Command tool behind approval and sandbox provider.
- Event timeline and resumable sessions.

### Phase 3 — desktop

- Tauri shell.
- Local server start/stop.
- Chat UI, settings, approvals, and logs.
- Model import and GGUF runtime setup assistant.

### Phase 4 — community layer

- Signed skill/connector manifests.
- Registry with review status and permission summaries.
- Import/export bundles.
- Compatibility tests and security scanning.

### Phase 5 — advanced orchestration

- Subagents with narrower capabilities.
- Scheduled workflows.
- ACP/MCP interoperability.
- Optional remote workers.
- Dataset and benchmark tools for evaluating agent reliability.
