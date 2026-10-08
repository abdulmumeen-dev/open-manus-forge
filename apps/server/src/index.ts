import 'dotenv/config';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { listConnectors, listModels, listSkills } from '../registry.js';
import type { ChatRequest } from '../../../packages/core/src.js';

const host = process.env.OPEN_MANUS_HOST ?? '127.0.0.1';
const port = Number(process.env.OPEN_MANUS_PORT ?? 8787);
const root = resolve(process.cwd());
const modelsDir = resolve(process.env.OPEN_MANUS_MODELS_DIR ?? './models');
const skillsDir = resolve('./skills');
const connectorsDir = resolve('./connectors');

function json(response: import('node:http').ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body, null, 2));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? `${host}:${port}`}`);
  if (request.method === 'GET' && url.pathname === '/health') {
    return json(response, 200, { ok: true, service: 'open-manus-forge', version: '0.1.0' });
  }
  if (request.method === 'GET' && url.pathname === '/v1/models') return json(response, 200, { models: listModels(modelsDir) });
  if (request.method === 'GET' && url.pathname === '/v1/skills') return json(response, 200, { skills: listSkills(skillsDir) });
  if (request.method === 'GET' && url.pathname === '/v1/connectors') return json(response, 200, { connectors: listConnectors(connectorsDir) });
  if (request.method === 'POST' && url.pathname === '/v1/chat') {
    let body = '';
    for await (const chunk of request) body += chunk;
    const input = JSON.parse(body || '{}') as ChatRequest;
    return json(response, 200, {
      mode: input.mode ?? 'ask',
      model: input.model ?? process.env.OPEN_MANUS_MODEL ?? 'not-configured',
      message: input.message ?? '',
      status: 'adapter-not-configured',
      next: 'Configure Ollama, llama.cpp, LM Studio, or an OpenAI-compatible endpoint.'
    });
  }
  return json(response, 404, { error: 'Not found' });
});

server.listen(port, host, () => console.log(`Open Manus Forge listening at http://${host}:${port}`));
