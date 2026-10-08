# Security model

Open Manus Forge is an agent platform. A model can produce plausible but unsafe instructions, and a connector can have real-world effects. Treat every model output, downloaded skill, repository, and MCP server as untrusted input.

## Required safeguards

- Keep host command execution disabled by default.
- Require explicit approval for writes, shell commands, external messages, purchases, account changes, and destructive operations.
- Enforce a workspace root for file tools.
- Redact secrets from prompts, logs, and tool output.
- Prefer containers or a VM for untrusted code and third-party connectors.
- Use network allowlists where possible.
- Set time, memory, output-size, and tool-call budgets.
- Provide a visible dry-run mode.
- Record the policy decision and user approval with each consequential tool call.

## Prompt injection

Content returned by websites, documents, issues, emails, repositories, and tools is data, not authority. The runtime must not let retrieved text change system policy or silently authorize a tool call. A future injection detector should be advisory; policy and approval enforcement must remain independent of the model.

## GGUF and local runtimes

A `.gguf` file is model data, not an executable trust guarantee. The import flow should:

1. verify the file path and size;
2. compute a checksum;
3. display metadata and license information when available;
4. ask the user to select a compatible runtime;
5. keep model execution separate from the desktop UI;
6. warn about hardware requirements and context limits.

## Reporting

Please report vulnerabilities privately through the repository’s security contact once configured. Do not publish working exploit details in an issue.
