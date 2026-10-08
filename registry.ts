import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ConnectorManifest, ModelSpec, SkillManifest } from '../../packages/core/src.js';

export function listModels(modelsDir: string): ModelSpec[] {
  if (!existsSync(modelsDir)) return [];
  return readdirSync(modelsDir)
    .filter((file) => file.toLowerCase().endsWith('.gguf'))
    .map((file) => ({
      id: file,
      provider: 'llama.cpp' as const,
      baseUrl: process.env.OPEN_MANUS_BASE_URL ?? 'http://127.0.0.1:8080',
      local: true,
      format: 'gguf' as const,
      capabilities: ['chat', 'completion']
    }));
}

export function listSkills(root: string): SkillManifest[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const path = join(root, entry.name);
      const file = join(path, 'SKILL.md');
      const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
      const description = text.match(/description:\s*(.+)/)?.[1]?.trim() ?? 'No description provided.';
      const risk = (text.match(/risk:\s*(low|medium|high)/)?.[1] ?? 'medium') as SkillManifest['risk'];
      return { name: entry.name, description, permissions: [], risk, path };
    });
}

export function listConnectors(root: string): ConnectorManifest[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => JSON.parse(readFileSync(join(root, entry.name), 'utf8')) as ConnectorManifest);
}
