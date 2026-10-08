# Phase 3 — Streaming and cancellation

This milestone adds a more responsive local-agent experience.

## Included

- `POST /v1/chat/stream` using Server-Sent Events.
- Ollama streaming support.
- OpenAI-compatible streaming support.
- Abort-signal cancellation when the client disconnects.
- Browser shell streaming response rendering.
- Cancel button for active responses.
- Stream start/end events in the local JSONL event log.

## API example

```bash
curl -N -X POST http://127.0.0.1:8787/v1/chat/stream \
  -H 'content-type: application/json' \
  -d '{"mode":"ask","message":"Explain this project"}'
```

The endpoint emits `data: {"text":"..."}` chunks, followed by an `event: done` marker. Provider failures are returned as an `event: error` event without exposing provider secrets.

## Next engineering milestones

- Tauri desktop shell that manages the local server lifecycle.
- Connector health checks and execution adapters.
- GGUF drop/import workflow with runtime detection.
- Skill installation and review UI.
- Persistent sessions and resumable event streams.
