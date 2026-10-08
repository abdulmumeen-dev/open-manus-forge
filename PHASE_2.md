# Phase 2 — Useful local agent

This slice turns the foundation into a usable local workspace.

## Included

- A provider-neutral chat runtime for Ollama and OpenAI-compatible endpoints.
- A browser desktop shell served by the local API at `/`.
- Ask and plan modes in the UI.
- JSONL event recording under `.open-manus/events.jsonl`.
- Event timeline endpoint at `/v1/events`.
- Workspace-bounded file read tool.
- Approval-gated file write tool.
- Runtime status, model, skill, and connector summaries.

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://127.0.0.1:8787`.

For Ollama:

```env
OPEN_MANUS_PROVIDER=ollama
OPEN_MANUS_MODEL=llama3.2
OPEN_MANUS_BASE_URL=http://127.0.0.1:11434
```

For an OpenAI-compatible local server such as LM Studio or llama.cpp server:

```env
OPEN_MANUS_PROVIDER=openai-compatible
OPEN_MANUS_MODEL=your-model
OPEN_MANUS_BASE_URL=http://127.0.0.1:1234/v1
```

## Deliberate limitations

The runtime does not execute shell commands, store provider keys in the browser, or silently perform high-impact file writes. The write tool returns an approval requirement until an explicit approval API is added.

## Next milestones

1. Add an explicit approval token endpoint and UI prompt.
2. Add streaming responses and cancellation.
3. Add a Tauri shell that starts/stops the local server.
4. Add model import metadata and a GGUF setup assistant.
5. Add connector health checks and signed community manifests.
