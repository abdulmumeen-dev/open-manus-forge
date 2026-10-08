import { appendFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { ChatRequest, Policy, ToolCall } from '../../packages/core/src.js';
import { decide } from '../../packages/core/src.js';

type ProviderReply = { text: string; provider: string; model: string; raw?: unknown };
type RuntimeOptions = { workspaceRoot: string; eventsPath: string; policy: Policy };

function record(eventsPath: string, event: Record<string, unknown>) {
  mkdirSync(dirname(eventsPath), { recursive: true });
  appendFileSync(eventsPath, JSON.stringify({ at: new Date().toISOString(), ...event }) + '\n');
}

async function providerChat(input: ChatRequest): Promise<ProviderReply> {
  const provider = process.env.OPEN_MANUS_PROVIDER ?? 'ollama';
  const model = input.model ?? process.env.OPEN_MANUS_MODEL ?? 'llama3.2';
  const baseUrl = (process.env.OPEN_MANUS_BASE_URL ?? 'http://127.0.0.1:11434').replace(/\/$/, '');
  const prompt = input.mode === 'plan' ? `You are a careful local planning assistant. Return a short numbered plan and list any risks.\n\n${input.message}` : input.message;
  if (provider === 'ollama') {
    const response = await fetch(`${baseUrl}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model, stream: false, messages: [{ role: 'user', content: prompt }] }) });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const data = await response.json() as { message?: { content?: string } };
    return { text: data.message?.content ?? '', provider, model, raw: data };
  }
  const response = await fetch(`${baseUrl}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', ...(process.env.OPEN_MANUS_API_KEY ? { authorization: `Bearer ${process.env.OPEN_MANUS_API_KEY}` } : {}) }, body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }) });
  if (!response.ok) throw new Error(`OpenAI-compatible endpoint returned ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return { text: data.choices?.[0]?.message?.content ?? '', provider, model, raw: data };
}

export async function runChat(input: ChatRequest, options: RuntimeOptions) {
  record(options.eventsPath, { type: 'chat.request', mode: input.mode, message: input.message, model: input.model });
  try {
    const reply = await providerChat(input);
    record(options.eventsPath, { type: 'chat.response', provider: reply.provider, model: reply.model });
    return { ...reply, status: 'ok' as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    record(options.eventsPath, { type: 'chat.error', error: message });
    return { text: 'The local model is not reachable yet. Configure Ollama or an OpenAI-compatible endpoint in .env.', provider: 'unavailable', model: input.model ?? 'not-configured', status: 'adapter-error' as const, error: message };
  }
}

export function executeReadFile(path: string, options: RuntimeOptions) {
  const target = resolve(options.workspaceRoot, path);
  const relative = target.startsWith(options.workspaceRoot) ? target.slice(options.workspaceRoot.length) : '';
  const call: ToolCall = { name: 'filesystem.read', input: { path: relative }, risk: 'low' };
  const decision = decide(options.policy, call);
  if (!decision.allowed) throw new Error(decision.reason);
  const text = readFileSync(target, 'utf8');
  record(options.eventsPath, { type: 'tool.result', tool: call.name, input: call.input, bytes: text.length });
  return { path: relative, text };
}

export function executeWriteFile(path: string, content: string, options: RuntimeOptions) {
  const target = resolve(options.workspaceRoot, path);
  if (!target.startsWith(options.workspaceRoot)) throw new Error('Workspace boundary violation');
  const call: ToolCall = { name: 'filesystem.write', input: { path }, risk: 'high' };
  const decision = decide(options.policy, call);
  if (!decision.allowed) throw new Error(decision.reason);
  if (decision.requiresApproval) return { approvalRequired: true, reason: decision.reason, path };
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
  record(options.eventsPath, { type: 'tool.result', tool: call.name, input: { path }, bytes: content.length });
  return { approvalRequired: false, path };
}

export function readEvents(eventsPath: string) {
  if (!existsSync(eventsPath)) return [];
  return readFileSync(eventsPath, 'utf8').trim().split('\n').filter(Boolean).slice(-100).map((line) => JSON.parse(line));
}
