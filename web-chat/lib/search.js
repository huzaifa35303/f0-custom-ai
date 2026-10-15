import { config } from './config.js';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '...')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export function stripTags(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<(nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, ' ')
      // Keep the sentence boundaries that block-level tags imply.
      .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '. ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .replace(/(\.\s*){2,}/g, '. ')
    .trim();
}

async function get(url, { timeout = 10000, accept = 'text/html' } = {}) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept, 'accept-language': 'en-US,en;q=0.9' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

// DuckDuckGo wraps every result in a redirect: //duckduckgo.com/l/?uddg=<encoded>
function realUrl(href) {
  const raw = decodeEntities(href);
  const m = raw.match(/[?&]uddg=([^&]+)/);
  const url = m ? decodeURIComponent(m[1]) : raw;
  if (url.startsWith('//')) return 'https:' + url;
  return /^https?:\/\//.test(url) ? url : null;
}

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export class RateLimited extends Error {}

// DuckDuckGo's no-JS endpoint: no API key, no account, no quota.
async function duckduckgo(query) {
  const res = await get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
  const html = await res.text();

  // Asked too often, it answers 202 with a challenge page instead of refusing
  // outright. That is throttling, not an absence of results, and the two want
  // very different things said about them.
  if (res.status === 202 || /anomaly|unusual traffic|challenge-form/i.test(html)) {
    throw new RateLimited('DuckDuckGo is throttling this machine');
  }

  const links = [
    ...html.matchAll(/<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g),
  ];
  const snippets = [
    ...html.matchAll(/<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g),
  ].map((m) => stripTags(m[1]));

  const out = [];
  const seen = new Set();
  links.forEach((m, i) => {
    const url = realUrl(m[1]);
    if (!url || seen.has(url) || out.length >= config.results) return;
    seen.add(url);
    out.push({ title: stripTags(m[2]), url, domain: domainOf(url), snippet: snippets[i] || '' });
  });
  return out;
}

// Fallback for when DuckDuckGo blocks the request or finds nothing.
async function wikipediaSearch(query) {
  const res = await get(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&format=json&srlimit=4`,
    { accept: 'application/json' }
  );
  const data = await res.json();
  return (data?.query?.search || []).map((hit) => ({
    title: hit.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, '_'))}`,
    domain: 'wikipedia.org',
    snippet: stripTags(hit.snippet || ''),
  }));
}

/**
 * Wikipedia's own one-paragraph summary of a topic. It is already written as
 * prose, so when the question asks what something is, this reads far better
 * than anything stitched together out of scraped sentences.
 */
export async function wikipediaSummary(query) {
  try {
    const hits = await wikipediaSearch(query);
    if (!hits.length) return null;
    const res = await get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        hits[0].title.replace(/ /g, '_')
      )}`,
      { accept: 'application/json', timeout: 8000 }
    );
    const data = await res.json();
    if (data.type === 'disambiguation' || !data.extract) return null;
    return { title: data.title, text: data.extract, domain: 'wikipedia.org' };
  } catch {
    return null;
  }
}

// Open a result and keep its readable text.
async function readPage(result) {
  try {
    const res = await get(result.url, { timeout: 8000 });
    const type = res.headers.get('content-type') || '';
    if (!type.includes('html') && !type.includes('text')) return '';
    const text = stripTags(await res.text());
    return text.length > 200 ? text.slice(0, config.charsPerPage) : '';
  } catch {
    return '';
  }
}

/**
 * Run a search and read the top pages.
 *
 * `alt` is the question stripped to its subject. Wikipedia's search wants a
 * topic, not a sentence: "who invented the thermos flask" matches nothing,
 * while "thermos flask" finds the article. DuckDuckGo handles either, so the
 * full question goes there and the subject is kept for the fallback.
 *
 * Returns { results, limited }. `results` is [{ title, url, domain, snippet,
 * text }], where `text` is '' when the page could not be opened and the
 * snippet is all we have. `limited` says the search engine was throttling us,
 * which is a different thing from the web having no answer.
 */
export async function searchWeb(query, alt = '') {
  const q = String(query || '').trim();
  if (!q) return { results: [], limited: false };

  let results = [];
  let limited = false;
  try {
    results = await duckduckgo(q);
  } catch (err) {
    limited = err instanceof RateLimited;
  }

  for (const attempt of [q, alt]) {
    if (results.length || !attempt) break;
    try {
      results = await wikipediaSearch(attempt);
    } catch {
      /* try the next wording, then give up */
    }
  }

  const pages = await Promise.all(results.slice(0, config.pagesPerSearch).map(readPage));
  return { results: results.map((r, i) => ({ ...r, text: pages[i] || '' })), limited };
}
