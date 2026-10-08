import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decide } from '../dist/packages/core/src.js';
import { listModels, registerModel } from '../dist/apps/server/registry.js';

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
