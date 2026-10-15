import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './lib/config.js';
import { answer } from './lib/answer.js';

const PUBLIC = fileURLToPath(new URL('./public/', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/chat') return await handleChat(req, res);
    if (req.method === 'GET' && req.url === '/api/health') return await handleHealth(res);
    if (req.method === 'GET') return await serveStatic(req, res);
    res.writeHead(405).end();
  } catch (err) {
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(err.message);
  }
});

// The only thing this app depends on is being able to reach the search engine.
async function handleHealth(res) {
  const body = { ok: false, error: null };
  try {
    const probe = await fetch('https://html.duckduckgo.com/html/?q=test', {
      headers: { 'user-agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000),
    });
    body.ok = probe.ok;
    if (!body.ok) body.error = `Search engine answered ${probe.status}`;
  } catch {
    body.error = 'No internet connection';
  }
  json(res, 200, body);
}

async function handleChat(req, res) {
  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    return json(res, 400, { error: 'Body must be JSON.' });
  }

  const messages = (payload.messages || [])
    .filter((m) => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string')
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (!messages.length || messages.at(-1).role !== 'user') {
    return json(res, 400, { error: 'Send a conversation ending in a user message.' });
  }

  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  });

  let open = true;
  req.on('close', () => {
    open = false;
  });
  const emit = (event, data) => {
    if (open && !res.writableEnded) res.write(`data: ${JSON.stringify({ event, ...data })}\n\n`);
  };

  // The question before this one, so a follow-up like "how old is he" can
  // borrow its subject.
  const asked = messages.filter((m) => m.role === 'user');
  const previous = asked.at(-2)?.content ?? '';

  try {
    const text = await answer(asked.at(-1).content, emit, { previous });
    emit('final', { text });
  } catch (err) {
    emit('error', { text: err.message });
  } finally {
    emit('done', {});
    res.end();
  }
}

async function serveStatic(req, res) {
  const path = new URL(req.url, 'http://localhost').pathname;
  // pathname always starts with '/', and join plus the prefix check below is
  // what actually stops '../' from escaping the public folder.
  const file = normalize(join(PUBLIC, path === '/' ? 'index.html' : path.slice(1)));
  if (!file.startsWith(PUBLIC)) return res.writeHead(403).end();

  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1e6) reject(new Error('Body too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

server.listen(config.port, () => {
  console.log(`Chat UI   http://localhost:${config.port}`);
});
