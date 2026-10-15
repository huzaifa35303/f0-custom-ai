import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './lib/config.js';
import { answer } from './lib/answer.js';
import { duckduckgo, wikipediaSearch } from './lib/search.js';

const PUBLIC = fileURLToPath(new URL('./public/', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * One request. Exported as the default so a host that drives this as a
 * function can call it directly, while `server.listen` below covers a host
 * that expects a listening server. Vercel Services is in beta and the docs do
 * not settle which of the two it uses for a Node entrypoint, so this answers
 * to both rather than betting on one.
 */
export default async function handler(req, res) {
  try {
    if (req.method === 'POST' && req.url === '/api/chat') return await handleChat(req, res);
    if (req.method === 'GET' && req.url === '/api/health') return await handleHealth(res);
    if (req.method === 'GET') return await serveStatic(req, res);
    res.writeHead(405).end();
  } catch (err) {
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(err.message);
  }
}

const server = createServer(handler);

/**
 * What this copy can actually do right now.
 *
 * A datacentre gets 403 from DuckDuckGo where a home connection does not, but
 * Wikipedia still answers and the app still works - just on a narrower slice
 * of the web. Reporting that as a failure would be wrong, so there are three
 * states rather than two.
 */
async function handleHealth(res) {
  if (config.langsearchApiKey) {
    return json(res, 200, { ok: true, mode: 'full', error: null, source: 'langsearch' });
  }

  const [web, encyclopedia] = await Promise.all([
    reachable(await Promise.allSettled([duckduckgo('test')])),
    reachable(await Promise.allSettled([wikipediaSearch('test')])),
  ]);

  if (web) return json(res, 200, { ok: true, mode: 'full', error: null });
  if (encyclopedia) {
    return json(res, 200, {
      ok: true,
      mode: 'limited',
      error: 'Web search is blocked here, so answers come from Wikipedia only',
    });
  }
  json(res, 200, { ok: false, mode: 'down', error: 'Cannot reach any search source' });
}

function reachable([outcome]) {
  return outcome.status === 'fulfilled' && outcome.value.length > 0;
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
  const previousAnswer = messages.filter((m) => m.role === 'assistant').at(-1)?.content ?? '';
  const model = payload.model === 'genni 2'
    ? 'genni 2'
    : (payload.model === 'liquid-neural' || payload.model === 'genni 1.1' || payload.model === 'genni ln' ? 'liquid-neural' : 'genni 1');
  const file = payload.file && typeof payload.file.content === 'string' ? payload.file : null;

  try {
    const text = await answer(asked.at(-1).content, emit, {
      messages,
      previous,
      previousAnswer,
      model,
      file,
    });
    emit('final', { text });
  } catch (err) {
    emit('error', { text: err.message });
  } finally {
    emit('done', {});
    res.end();
  }
}

async function serveStatic(req, res) {
  let path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/sitemap' || path === '/sitemap/') path = '/sitemap.xml';
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
