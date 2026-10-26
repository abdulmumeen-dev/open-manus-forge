import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decide } from '../dist/packages/core/src.js';
import { listModels, registerModel } from '../dist/apps/server/registry.js';
import { approveWrite, executeWriteFile } from '../dist/apps/server/runtime.js';

test('high-risk writes require explicit approval', () => {
  const decision = decide({ requireApproval: true, allowShell: false, allowNetwork: true, workspaceRoot: process.cwd(), maxToolCalls: 20 }, { name: 'filesystem.write', input: {}, risk: 'high' });
  assert.equal(decision.allowed, true);
  assert.equal(decision.requiresApproval, true);
});

test('GGUF model registration is persisted and discoverable', async () => {
  const root = await mkdtemp(join(tmpdir(), 'open-manus-'));
  try {
    const entry = registerModel(root, { filename: 'qwen2.5-3b.gguf', architecture: 'qwen2', contextLength: 32768 });
    assert.equal(entry.filename, 'qwen2.5-3b.gguf');
    const catalog = JSON.parse(await readFile(join(root, 'catalog.json'), 'utf8'));
    assert.equal(catalog[0].architecture, 'qwen2');
    assert.equal(listModels(root)[0].id, 'qwen2.5-3b.gguf');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('file writes remain pending until explicitly approved', async () => {
  const root = await mkdtemp(join(tmpdir(), 'open-manus-'));
  const eventsPath = join(root, '.events.jsonl');
  const options = { workspaceRoot: root, eventsPath, policy: { requireApproval: true, allowShell: false, allowNetwork: true, workspaceRoot: root, maxToolCalls: 20 } };
  try {
    const pending = executeWriteFile('notes/hello.txt', 'hello forge', options);
    assert.equal(pending.approvalRequired, true);
    assert.equal(await import('node:fs/promises').then(({ access }) => access(join(root, 'notes/hello.txt')).then(() => true, () => false)), false);
    assert.equal(approveWrite(pending.approvalId, options).approved, true);
    assert.equal(await readFile(join(root, 'notes/hello.txt'), 'utf8'), 'hello forge');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('file writes cannot escape the configured workspace', async () => {
  const root = await mkdtemp(join(tmpdir(), 'open-manus-'));
  const options = { workspaceRoot: root, eventsPath: join(root, '.events.jsonl'), policy: { requireApproval: true, allowShell: false, allowNetwork: true, workspaceRoot: root, maxToolCalls: 20 } };
  try {
    assert.throws(() => executeWriteFile('../outside.txt', 'blocked', options), /Workspace boundary violation/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
