import { config } from './config.js';
import { searchWeb, wikipediaSummary } from './search.js';
import { clean } from './clean.js';
import { chatReply } from './chat.js';

const STOPWORDS = new Set(
  `a an the and or but if then than that this these those of in on at to for from by with about into over after before
   is are was were be been being am do does did doing have has had having can could should would will shall may might must
   i you he she it we they me him her us them my your his its our their what which who whom whose when where why how
   tell show give find explain please thanks thank hey hi hello there here s t re ve ll don not no yes ok okay`
    .split(/\s+/)
    .filter(Boolean)
);

const JUNK =
  /(cookie|javascript|enable js|sign in|sign up|log in|subscribe|newsletter|all rights reserved|privacy policy|terms of (use|service)|advertisement|©|skip to (main )?content|follow us|share this|read more|click here|price target|silent looping video|play video|pause video|video player|image caption|spread the love)/i;

// "Get the latest NVIDIA stock news to help you in your trading" is a page
// selling itself, not an answer. Sentences that open by telling the reader to
// do something are almost always the site talking about itself.
const PITCH = /^(get|find|read|see|click|browse|discover|explore|view|check|stay|learn|shop|buy|download|sign|join|follow|subscribe|track|compare)\b/i;

// Cross-reference lines and page titles that scraping sweeps up with the prose.
const CROSS_REF =
  /^(see also|this article|from wikipedia|main article|redirected from)\b|^for\b.{0,80},\s*see\b|\s[-–]\s*wikipedia\b|\bpart of a series on\b/i;

// The references section of an encyclopedia article: real text, but it is
// bibliography rather than anything that answers a question.
const CITATION =
  /\bretrieved \d|\barchived from the original\b|\bisbn\b|\bdoi:|\bissn\b|\bp{1,2}\.\s*\d+[-–]\d+|↑/i;

// Pages that serve escaped markup or embedded JSON leak it into the text.
// Braces, angle brackets and leftover square brackets mean we are reading
// machinery rather than a sentence.
const MARKUP = /&[a-z]+;|&#\d+;|[{}<>\\\[\]]/i;

/** Title Case Headlines Look Like This and carry no actual statement. */
function isHeadline(sentence) {
  const words = sentence.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
  if (words.length < 3 || sentence.length > 120) return false;
  const capitalised = words.filter((w) => /^[A-Z]/.test(w)).length;
  return capitalised / words.length > 0.6;
}

// ------------------------------------------------------------------ scoring

function words(text) {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) || []).filter(
    (w) => w.length > 1 && !STOPWORDS.has(w)
  );
}

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+(?=["'(]?[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * How much of the smaller sentence is already contained in the other one.
 * Overlap rather than Jaccard, because two pages saying the same thing at
 * different lengths is exactly the repetition worth dropping.
 */
function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size);
}

/** Rarer words across the fetched pages carry more weight than common ones. */
function idfTable(terms, documents) {
  const table = new Map();
  for (const term of terms) {
    const hits = documents.filter((d) => d.includes(term)).length;
    table.set(term, Math.log((documents.length + 1) / (hits + 1)) + 1);
  }
  return table;
}

function domainWeight(domain) {
  if (/\.gov($|\.)|\.edu($|\.)/.test(domain)) return 1.25;
  if (/wikipedia\.org$/.test(domain)) return 1.15;
  if (/(pinterest|quora|facebook|reddit|tiktok|answers)\./.test(domain)) return 0.8;
  return 1;
}

const WANTS_NUMBER =
  /\b(how (many|much|old|long|far|tall|big)|price|cost|population|percent|rate|when|what year|date)\b/i;

function scoreSentence(sentence, { idf, wantsNumber, weight, position }) {
  if (sentence.length < 40 || sentence.length > 340) return 0;
  if (JUNK.test(sentence) || PITCH.test(sentence)) return 0;
  if (CROSS_REF.test(sentence) || CITATION.test(sentence)) return 0;
  if (MARKUP.test(sentence) || isHeadline(sentence)) return 0;
  // Navigation strips and link lists, not prose.
  if (sentence.includes('|')) return 0;
  if ((sentence.match(/,/g) || []).length > 5) return 0;
  // A lead-in to a formula or list that we would be quoting without its point.
  if (/:\.?$/.test(sentence)) return 0;
  // An answer is a statement. A sentence asking something is a page heading,
  // an FAQ entry, or the question itself quoted back.
  if (sentence.includes('?')) return 0;
  if (!/[a-z]/.test(sentence)) return 0;
  // A scraped table row reads as one long sentence of mostly figures, or opens
  // with its rank column: "3 Shanghai Tower 632 2,073 128 ...".
  if ((sentence.match(/\d/g) || []).length / sentence.length > 0.15) return 0;
  if (/^\d+\s+[A-Z]/.test(sentence)) return 0;

  const seen = new Set();
  let score = 0;
  for (const w of words(sentence)) {
    if (idf.has(w) && !seen.has(w)) {
      seen.add(w);
      score += idf.get(w);
    }
  }
  if (!score) return 0;

  // Covering more of the question beats repeating one word from it.
  score *= 1 + seen.size / (idf.size + 1);
  if (wantsNumber && /\d/.test(sentence)) score *= 1.3;
  // Pages put the answer near the top far more often than near the bottom.
  score *= 1 + Math.max(0, 1 - position / 25) * 0.3;
  return score * weight;
}

// ------------------------------------------------------------------ compose

/**
 * The topic a question is about, with the question itself peeled off:
 * "what is the capital of australia?" -> "capital of australia".
 *
 * Wikipedia is searched with this rather than the raw question, because the raw
 * question matches the article "Question".
 */
function subject(question) {
  return question
    .trim()
    .replace(/[?!.]+$/, '')
    .replace(
      /^(can you |could you |please |tell me |do you know )*(about |what(?:'s| is| are| was| were)?|whats|who(?:'s| is| are| was| were)?|where(?:'s| is| are)?|when (?:is|was|did)|why (?:is|was|did)|how (?:do|does|did|is|are))\s+/i,
      ''
    )
    .replace(/^(a|an|the)\s+/i, '')
    .trim();
}

function looksLikeDefinition(question) {
  return /^(who|what|whats|what's|where)\b/i.test(question.trim());
}

/** Does the article we landed on actually have to do with what was asked? */
function relevant(summary, topic) {
  const wanted = new Set(words(topic));
  if (!wanted.size) return false;
  const title = words(summary.title);
  const inTitle = title.filter((w) => wanted.has(w)).length;
  if (inTitle) return true;
  // Or the topic's words turn up in the opening paragraph.
  const text = new Set(words(summary.text));
  const covered = [...wanted].filter((w) => text.has(w)).length;
  return covered / wanted.size >= 0.6;
}

function tidy(sentence) {
  return sentence
    .replace(/\[[^\]]{0,20}\]/g, '') // footnote and "[ update ]" markers
    .replace(/^\W+/, '')
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\.{2,}/g, '.')
    .trim();
}

function paragraphs(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i += 3) out.push(lines.slice(i, i + 3).join(' '));
  return out.join('\n\n');
}

/**
 * Answer a question using only the web.
 *
 * There is no language model here: the reply is built from the best sentences
 * on the pages the search returned, picked by how well they cover the question.
 * That makes it good at facts and useless at reasoning, which is the trade this
 * app is making.
 */
export async function answer(question, emit = () => {}) {
  const canned = chatReply(question);
  if (canned) {
    emit('token', { text: canned });
    return canned;
  }

  emit('status', { text: 'Searching the web' });
  const query = question.replace(/\s+/g, ' ').trim().slice(0, 300);

  const topic = subject(query);
  const [results, found] = await Promise.all([
    searchWeb(query),
    looksLikeDefinition(query) && topic ? wikipediaSummary(topic) : Promise.resolve(null),
  ]);
  const summary = found && relevant(found, topic) ? found : null;

  if (!results.length && !summary) {
    return "I couldn't find anything on that. Try rephrasing it, or give me a bit more to go on.";
  }

  emit('status', { text: 'Reading the results' });

  const terms = [...new Set(words(query))];
  const documents = results.map((r) => (r.text || r.snippet || '').toLowerCase());
  const idf = idfTable(terms, documents.length ? documents : ['']);
  const wantsNumber = WANTS_NUMBER.test(query);

  const pool = [];
  for (const result of results) {
    const body = result.text || result.snippet || '';
    const weight = domainWeight(result.domain);
    // Tidy before scoring, so the filters judge the sentence we would actually show.
    sentences(body).forEach((raw, position) => {
      const sentence = tidy(raw);
      const score = scoreSentence(sentence, { idf, wantsNumber, weight, position });
      if (score > 0) pool.push({ sentence, score });
    });
  }
  pool.sort((a, b) => b.score - a.score);

  // Wikipedia's own prose opens the answer when the question asks what something is.
  const chosen = summary ? sentences(summary.text).slice(0, 3) : [];
  const seen = chosen.map((s) => new Set(words(s)));

  for (const item of pool) {
    if (chosen.length >= config.maxSentences) break;
    const tokens = new Set(words(item.sentence));
    if (seen.some((other) => overlap(tokens, other) > 0.6)) continue;
    seen.push(tokens);
    chosen.push(item.sentence);
  }

  if (!chosen.length) {
    return 'I searched for that, but the pages that came back were mostly navigation and boilerplate. Try wording it differently.';
  }

  const text = clean(paragraphs(chosen.map((s) => (/[.!?]$/.test(s) ? s : s + '.'))));

  // Stream it out a word at a time, so the page fills in the way a reply would.
  emit('status', { text: 'Writing the answer' });
  for (const chunk of text.match(/\S+\s*/g) || []) emit('token', { text: chunk });
  return text;
}
