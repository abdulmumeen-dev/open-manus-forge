# Open Manus Forge

An open-source, local-first agent workspace for building useful things with AI.

Open Manus Forge is designed as a **modular alternative to closed agent workspaces**. It combines a chat interface, tool-using agent runtime, reusable skills, MCP-style connectors, local model support, and a desktop shell without requiring one vendor or one model provider.

> The repository now contains a complete runnable local-first MVP. It is not intended to claim feature parity with a hosted commercial platform.

## What it is meant to become

- **Agent mode:** plan, inspect, act, verify, and explain work through explicit steps.
- **Local models:** use Ollama, llama.cpp-compatible servers, LM Studio-compatible endpoints, or an OpenAI-compatible API.
- **GGUF drop-in:** place a `.gguf` file in the configured models directory and register it with a local runtime such as llama.cpp or Ollama.
- **Skills:** reusable `SKILL.md` workflows with scripts, references, templates, and progressive loading.
- **Connectors:** MCP and HTTP adapters for GitHub, files, web search, databases, email, and community services.
- **Desktop app:** a cross-platform shell that talks to the same local server as the CLI and future web client.
- **Community projects:** a registry of skills, connectors, recipes, and problem-solving tools with review and permission metadata.

## Runnable MVP

This first slice contains:

- A provider-neutral TypeScript core for model requests and tool calls.
- A local model registry with GGUF metadata and runtime recommendations.
- A skill loader with frontmatter and progressive disclosure.
- A connector registry with permission declarations.
- A policy engine for approval gates and workspace boundaries.
- A local HTTP server exposing health, models, skills, connectors, streaming chat, events, and approvals.
- A browser desktop shell with streaming responses, cancellation, and approval controls.
- A Node desktop launcher that starts the local server and opens the shell.
- GGUF catalog registration through `POST /v1/models/register`.
- Connector health inspection through `GET /v1/connectors/health`.
- Deterministic MVP tests for policy gates and GGUF registration.

## Architecture

```text
Desktop / CLI / Web UI
          |
          v
Local API server  ----  Policy + approval engine
          |
          +----  Agent runtime  ----  Model adapter
          |             |                 |
          |             |                 +-- Ollama
          |             |                 +-- llama.cpp / GGUF
          |             |                 +-- LM Studio
          |             |                 +-- OpenAI-compatible APIs
          |             |
          |             +---- Skills (SKILL.md)
          |             +---- Connectors (MCP / HTTP)
          |             +---- Workspace + event log
          |
          +---- Community registry (optional, never required for local use)
```

## Quick start

```bash
npm install
npm run dev
```

The server starts on `http://127.0.0.1:8787`.

To launch the browser desktop shell automatically:

```bash
npm run desktop
```

Run the deterministic MVP tests with:

```bash
npm run build && npm test
```

Check the runtime:

```bash
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/v1/models
curl http://127.0.0.1:8787/v1/skills
curl http://127.0.0.1:8787/v1/connectors
curl http://127.0.0.1:8787/v1/connectors/health
```

Register GGUF metadata after placing a model in `models/`:

```bash
curl -X POST http://127.0.0.1:8787/v1/models/register \
  -H 'content-type: application/json' \
  -d '{"filename":"your-model.gguf","architecture":"llama","contextLength":8192}'
```

## Local model configuration

Copy `.env.example` to `.env` and choose a provider:

```env
OPEN_MANUS_PROVIDER=ollama
OPEN_MANUS_MODEL=llama3.2
OPEN_MANUS_BASE_URL=http://127.0.0.1:11434
```

For an OpenAI-compatible server:

```env
OPEN_MANUS_PROVIDER=openai-compatible
OPEN_MANUS_MODEL=your-model-name
OPEN_MANUS_BASE_URL=http://127.0.0.1:1234/v1
OPEN_MANUS_API_KEY=
```

For GGUF files, configure a llama.cpp or compatible server and place the file in `models/`. The registry is intentionally runtime-neutral: the app does not pretend that a `.gguf` file can execute by itself without a compatible inference runtime.

## Safety model

Agent tools can read files, run commands, call networks, and change external systems. Open Manus Forge therefore separates:

1. **Capability:** what a connector or tool can do.
2. **Policy:** what the workspace allows.
3. **Approval:** whether the user must approve a specific action.
4. **Isolation:** whether execution occurs in a host process, container, VM, or restricted workspace.

Read [SECURITY.md](SECURITY.md) before enabling command execution or third-party connectors.

## Community roadmap

The project is intentionally broader than a coding agent. Community contributions can add:

- Accessibility and translation skills.
- Local-first research and citation workflows.
- Data cleaning and small-business reporting tools.
- Privacy, redaction, and document-safety connectors.
- Education, civic information, and public-service workflows.
- Offline disaster-response and low-bandwidth tools.
- Developer recipes for testing, debugging, migration, and documentation.
- Connectors for open data, Git hosting, calendars, issue trackers, and knowledge bases.

Every contribution should declare its permissions, external services, data handling, and offline fallback.

## License

MIT. See [LICENSE](LICENSE).
