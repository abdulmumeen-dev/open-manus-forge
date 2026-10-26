import 'dotenv/config';
import { createServer } from 'node:http';
import { resolve, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { connectorHealth, listConnectors, listModels, listSkills, registerModel } from '../registry.js';
import { approveWrite, executeReadFile, executeWriteFile, listPendingWrites, readEvents, runChat, streamChat } from '../runtime.js';
import type { ChatRequest, Policy } from '../../../packages/core/src.js';

const host = process.env.OPEN_MANUS_HOST ?? '127.0.0.1';
const port = Number(process.env.OPEN_MANUS_PORT ?? 8787);
const root = resolve(process.cwd());
const modelsDir = resolve(process.env.OPEN_MANUS_MODELS_DIR ?? './models');
const skillsDir = resolve('./skills');
const connectorsDir = resolve('./connectors');
const eventsPath = resolve(process.env.OPEN_MANUS_EVENTS_PATH ?? './.open-manus/events.jsonl');
const policy: Policy = { requireApproval: true, allowShell: false, allowNetwork: true, workspaceRoot: root, maxToolCalls: 20 };

function json(response: import('node:http').ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
  response.end(JSON.stringify(body, null, 2));
}
async function body(request: import('node:http').IncomingMessage) { let value = ''; for await (const chunk of request) value += chunk; return JSON.parse(value || '{}') as Record<string, unknown>; }

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? `${host}:${port}`}`);
    if (request.method === 'GET' && url.pathname === '/') { response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return response.end(readFileSync(join(root, 'apps/server/public/index.html'), 'utf8')); }
    if (request.method === 'GET' && url.pathname === '/health') return json(response, 200, { ok: true, service: 'open-manus-forge', version: '0.2.0', provider: process.env.OPEN_MANUS_PROVIDER ?? 'ollama' });
    if (request.method === 'GET' && url.pathname === '/v1/models') return json(response, 200, { models: listModels(modelsDir) });
    if (request.method === 'GET' && url.pathname === '/v1/skills') return json(response, 200, { skills: listSkills(skillsDir) });
    if (request.method === 'GET' && url.pathname === '/v1/connectors') return json(response, 200, { connectors: listConnectors(connectorsDir) });
    if (request.method === 'GET' && url.pathname === '/v1/connectors/health') return json(response, 200, { connectors: await connectorHealth(connectorsDir) });
    if (request.method === 'POST' && url.pathname === '/v1/models/register') { const input = await body(request); return json(response, 201, registerModel(modelsDir, { filename: String(input.filename ?? ''), architecture: input.architecture ? String(input.architecture) : undefined, contextLength: input.contextLength ? Number(input.contextLength) : undefined, notes: input.notes ? String(input.notes) : undefined })); }
    if (request.method === 'GET' && url.pathname === '/v1/events') return json(response, 200, { events: readEvents(eventsPath) });
    if (request.method === 'GET' && url.pathname === '/v1/approvals') return json(response, 200, { approvals: listPendingWrites() });
    if (request.method === 'POST' && url.pathname === '/v1/chat/stream') {
      const controller = new AbortController();
      request.on('aborted', () => controller.abort());
      const input = await body(request) as unknown as ChatRequest;
      response.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', connection: 'keep-alive', 'access-control-allow-origin': '*' });
      try {
        await streamChat(input, { workspaceRoot: root, eventsPath, policy }, controller.signal, (text) => response.write(`data: ${JSON.stringify({ text })}\n\n`));
        response.write('event: done\ndata: {}\n\n');
      } catch (error) {
        if (!controller.signal.aborted) response.write(`event: error\ndata: ${JSON.stringify({ error: error instanceof Error ? error.message : String(error) })}\n\n`);
      }
      return response.end();
    }
    if (request.method === 'POST' && url.pathname === '/v1/chat') return json(response, 200, await runChat(await body(request) as unknown as ChatRequest, { workspaceRoot: root, eventsPath, policy }));
    if (request.method === 'POST' && url.pathname === '/v1/tools/read') { const input = await body(request); return json(response, 200, executeReadFile(String(input.path ?? ''), { workspaceRoot: root, eventsPath, policy })); }
    if (request.method === 'POST' && url.pathname === '/v1/tools/write') { const input = await body(request); return json(response, 200, executeWriteFile(String(input.path ?? ''), String(input.content ?? ''), { workspaceRoot: root, eventsPath, policy })); }
    if (request.method === 'POST' && url.pathname.startsWith('/v1/approvals/')) return json(response, 200, approveWrite(url.pathname.split('/').pop() ?? '', { workspaceRoot: root, eventsPath, policy }));
    return json(response, 404, { error: 'Not found' });
  } catch (error) { return json(response, 400, { error: error instanceof Error ? error.message : String(error) }); }
});
server.listen(port, host, () => console.log(`Open Manus Forge listening at http://${host}:${port}`));
