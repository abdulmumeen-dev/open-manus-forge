import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ConnectorManifest, ModelSpec, SkillManifest } from '../../packages/core/src.js';

type ModelCatalogEntry = { id: string; filename: string; architecture?: string; contextLength?: number; notes?: string; registeredAt: string };

function catalogPath(modelsDir: string) { return join(modelsDir, 'catalog.json'); }
function readCatalog(modelsDir: string): ModelCatalogEntry[] {
  const path = catalogPath(modelsDir);
  if (!existsSync(path)) return [];
  try { return JSON.parse(readFileSync(path, 'utf8')) as ModelCatalogEntry[]; } catch { return []; }
}

export function listModels(modelsDir: string): ModelSpec[] {
  if (!existsSync(modelsDir)) return [];
  const files = readdirSync(modelsDir).filter((file) => file.toLowerCase().endsWith('.gguf'));
  const catalog = readCatalog(modelsDir);
  const models = new Map<string, ModelSpec>();
  for (const file of files) models.set(file, { id: file, provider: 'llama.cpp', baseUrl: process.env.OPEN_MANUS_BASE_URL ?? 'http://127.0.0.1:8080', local: true, format: 'gguf', capabilities: ['chat', 'completion'] });
  for (const entry of catalog) models.set(entry.id, { id: entry.id, provider: 'llama.cpp', baseUrl: process.env.OPEN_MANUS_BASE_URL ?? 'http://127.0.0.1:8080', local: true, format: 'gguf', capabilities: ['chat', 'completion'] });
  return [...models.values()];
}

export function registerModel(modelsDir: string, input: { filename: string; architecture?: string; contextLength?: number; notes?: string }) {
  if (!input.filename.toLowerCase().endsWith('.gguf')) throw new Error('Only .gguf models can be registered');
  mkdirSync(modelsDir, { recursive: true });
  const entries = readCatalog(modelsDir).filter((entry) => entry.id !== input.filename);
  const entry: ModelCatalogEntry = { id: input.filename, ...input, registeredAt: new Date().toISOString() };
  writeFileSync(catalogPath(modelsDir), JSON.stringify([...entries, entry], null, 2) + '\n');
  return entry;
}

export function listSkills(root: string): SkillManifest[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => {
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
  return readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith('.json')).map((entry) => JSON.parse(readFileSync(join(root, entry.name), 'utf8')) as ConnectorManifest);
}

export async function connectorHealth(root: string) {
  return listConnectors(root).map((connector) => ({ name: connector.name, status: 'declared', capabilities: connector.capabilities }));
}
