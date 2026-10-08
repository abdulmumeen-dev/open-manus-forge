import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decide } from '../dist/packages/core/src.js';
import { listModels } from '../dist/apps/server/registry.js';

test('high-risk writes require explicit approval', () => {
  const decision = decide({ requireApproval: true, allowShell: false, allowNetwork: true, workspaceRoot: process.cwd(), maxToolCalls: 20 }, { name: 'filesystem.write', input: {}, risk: 'high' });
  assert.equal(decision.allowed, true);
  assert.equal(decision.requiresApproval, true);
});

test('GGUF files are discoverable in the local model registry', async () => {
  const root = await mkdtemp(join(tmpdir(), 'open-manus-'));
  try {
    await writeFile(join(root, 'qwen2.5-3b.gguf'), 'placeholder');
    const models = listModels(root);
    assert.equal(models[0].id, 'qwen2.5-3b.gguf');
    assert.equal(models[0].format, 'gguf');
  } finally { await rm(root, { recursive: true, force: true }); }
});
