import { config } from './config.js';
import { searchWeb, wikipediaSummary } from './search.js';
import { clean } from './clean.js';
import { chatReply } from './chat.js';
import { calculate } from './calc.js';
import { detectCommand, applyCommand } from './commands.js';
import { detectBrainCommand, runBrainCommand, recall } from './brain.js';
import { generateAI } from './ai.js';

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

// A question that leans on the one before it: a pronoun with no antecedent, or
const PRONOUN = /\b(he|him|his|she|her|hers|it|its|they|them|their|that|this|those|these|there)\b/i;
const FRAGMENT = /^(and|also|what about|how about|why|and what|ok(ay)? and|so|then)\b/i;
const FOLLOWUP_QUESTION =
  /^(who\s+(make|made|created|founded|owns?|built|runs?)|when\s+(was\s+it\s+)?(launched|released|founded|born|created|started)|where\s+(is\s+it\s+)?(from|located|based)|how\s+(does\s+it\s+work|much|old|to\s+use)|what\s+(about|features?|version|price|cost|is\s+the\s+difference)|is\s+it\s+(free|open\s*source|safe|good|better)|can\s+it\s+|tell\s+me\s+more|give\s+examples?)\b/i;

/**
 * Fold the previous question's subject into this one.
 *
 * "what is gemini" then "who make it" or "when was it launched" carries "gemini"
 * into the follow-up question so search engines and the AI understand what
 * entity is being asked about across conversation turns.
 */
function resolveFollowUp(question, previous, previousAnswer = '', messages = []) {
  const q = question.trim();
  if (!previous && (!messages || !messages.length)) return q;

  let topic = subject(previous);
  if (!topic && messages && messages.length > 1) {
    for (let i = messages.length - 2; i >= 0; i--) {
      if (messages[i]?.role === 'user') {
        const sub = subject(messages[i].content);
        if (sub && sub.length > 2 && !PRONOUN.test(sub)) {
          topic = sub;
          break;
        }
      }
    }
  }

  if (!topic) return q;

  // Question contains a pronoun: e.g. "who make it", "what is its speed", "how old is he"
  if (PRONOUN.test(q)) {
    const swapped = q.replace(PRONOUN, topic);
    return swapped === q ? `${q} ${topic}`.trim() : swapped;
  }

  // Follow-up question starters or fragments: e.g. "who make", "who made", "when launched", "is it free"
  if (FOLLOWUP_QUESTION.test(q) || FRAGMENT.test(q)) {
    return `${q} ${topic}`.trim();
  }

  return q;
}

/**
 * Drop the polite wrapper around a question before searching for it.
 *
 * "i want to know the capital of france" searched for those words literally
 * and came back with a song called "I Want More Money". The search engine
 * wants the subject, not the request.
 */
function stripRequest(question) {
  const stripped = question
    .trim()
    .replace(
      /^((can|could|will|would) you\s+)?(please\s+)?(i\s+)?(just\s+)?(want(ed)? to know|need to know|would like to know|tell me( about)?|show me|find me|give me|explain|search( for)?|look up|google)\s+/i,
      ''
    )
    .replace(/^(about|the)\s+/i, '')
    .trim();
  // Never strip away the whole message: "tell me more" is all wrapper.
  return stripped.length >= 3 ? stripped : question.trim();
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

// --------------------------------------------------------------- the lead

const MONTHS =
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i;

/** What shape of thing the question is asking for. */
function shapeOf(query) {
  const q = query.trim();
  if (/^who\b/i.test(q)) return 'who';
  if (/^when\b|\bwhat year\b|\bwhat date\b/i.test(q)) return 'when';
  if (/^where\b/i.test(q)) return 'where';
  // "what is the population of X" wants a figure just as much as "how many".
  if (WANTS_NUMBER.test(q)) return 'amount';
  return 'general';
}

/**
 * How much a sentence reads like *the* answer rather than background.
 *
 * Scoring alone finds the sentences that are about the question; this finds the
 * one that answers it. A "when" question wants the sentence with the date in
 * it, a "who" question wants the one with a name, and in every case a statement
 * of the form "X is ..." beats a sentence that merely mentions X.
 */
function directness(sentence, shape, head, asked) {
  let factor = 1;

  if (/\b(is|are|was|were|refers to|means|became|serves as|known as)\b/i.test(sentence)) {
    factor *= 1.3;
  }

  // "Canberra, the capital city of Australia, is ..." opens with a name the
  // question did not contain, which is what naming an answer looks like.
  // "The Australian Capital Territory is ..." only restates the question.
  // Matched on a stem, so "Australian" counts as the question's "Australia"
  // and does not pass as a new name.
  const opener = words(sentence)[0];
  const restated =
    !opener ||
    [...asked].some(
      (t) => t.startsWith(opener.slice(0, 5)) || opener.startsWith(t.slice(0, 5))
    );
  if (/^[A-Z]/.test(sentence) && !restated) factor *= 1.3;
  if (head && new RegExp(`\\b${head.replace(/[^\w'-]/g, '')}\\b`, 'i').test(sentence)) {
    factor *= 1.25;
  }
  if (shape === 'when' && (/\b(1\d{3}|20\d{2})\b/.test(sentence) || MONTHS.test(sentence))) {
    factor *= 1.45;
  }
  if (shape === 'amount' && /\d/.test(sentence)) factor *= 1.45;
  if (shape === 'who' && /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(sentence)) factor *= 1.3;
  if (shape === 'where' && /\b(in|at|near|on)\s+[A-Z]/.test(sentence)) factor *= 1.25;

  // The lead is the line someone could read out as the answer, so a paragraph
  // of qualifications makes a poor one and so does a four-word fragment.
  if (sentence.length > 220) factor *= 0.7;
  else if (sentence.length < 60) factor *= 0.9;

  return factor;
}

/**
 * Answer a question using only the web.
 *
 * There is no language model here: the reply is built from the best sentences
 * on the pages the search returned, picked by how well they cover the question.
 * That makes it good at facts and useless at reasoning, which is the trade this
 * app is making.
 */
export async function answer(
  question,
  emit = () => {},
  { messages = [], previous = '', previousAnswer = '', model = 'genni 1', file = null } = {}
) {
  const say = (text) => {
    emit('token', { text });
    return text;
  };

  let fileContext = '';
  if (file && typeof file.content === 'string' && file.content.trim()) {
    fileContext = `Attached Document [${file.name || 'document'}]:\n${file.content.slice(0, 12000)}\n\n`;
  }

  const canned = !fileContext ? chatReply(question, model) : null;
  if (canned) return say(canned);

  // Sums are worked out, not looked up.
  const sum = !fileContext ? calculate(question) : null;
  if (sum) return say(sum);

  // Teaching, forgetting, or asking what it knows.
  const brainCommand = !fileContext ? detectBrainCommand(question) : null;
  if (brainCommand) return say(await runBrainCommand(brainCommand));

  // An instruction about the answer above, not a question for the web.
  let wanted = config.maxSentences;
  const command = detectCommand(question);
  if (command) {
    const result = applyCommand(command, previousAnswer);
    if (!result.rerun) return say(result.text);

    // If it is a rewrite / translation instruction, use AI with previousAnswer as context
    if (command === 'rewrite' && previousAnswer) {
      const rewritten = await generateAI({
        question,
        context: fileContext + previousAnswer,
        conversation: messages,
        model,
        onStatus: (s) => emit('status', s),
        onThought: (t) => emit('thought', { text: t }),
        onToken: (c) => emit('token', { text: c }),
      });
      if (rewritten) return say(clean(rewritten));
      return say("I can't reword or translate that right now — try asking as a list or cutting it shorter.");
    }

    // "more" needs fresh material, so the earlier question is asked again,
    // this time with room for twice as much of it.
    if (previous) question = previous;
    wanted = config.maxSentences * 2;
  }

  // Anything taught beats anything found: you know your own business, a
  // search result does not.
  const known = await recall(question);
  if (known.length) {
    const aiRecall = await generateAI({
      question,
      context: fileContext + known.join('\n'),
      conversation: messages,
      model,
      onStatus: (s) => emit('status', s),
      onThought: (t) => emit('thought', { text: t }),
      onToken: (c) => emit('token', { text: c }),
    });
    if (aiRecall) return clean(aiRecall);
    return say(known.join(' '));
  }

  // Direct visual image generation check (for genni 3 and image creation requests)
  const isImageRequest = /(?:(?:generate|draw|create|paint|sketch|design|make|render|show me|give me|produce|visualize)\s+(?:an?\s+)?(?:image|picture|photo|wallpaper|logo|art|portrait|illustration|drawing|graphic|poster|visual)|^(?:image|picture|photo|wallpaper|logo|portrait|art)\s+of\b)/i.test(question);
  if (isImageRequest && (model === 'genni 3' || model === 'auto')) {
    emit('status', { text: 'Designing visual prompt & creating image' });
    const imageAi = await generateAI({
      question,
      context: fileContext,
      conversation: messages,
      model: 'genni 3',
      onStatus: (s) => emit('status', s),
      onThought: (t) => emit('thought', { text: t }),
      onToken: (c) => emit('token', { text: c }),
    });
    if (imageAi) return clean(imageAi);
  }

  emit('status', { text: 'Searching the web' });
  const resolvedFollowUp = resolveFollowUp(question, previous, previousAnswer, messages);
  const query = stripRequest(resolvedFollowUp)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);

  const topic = subject(query);
  const [search, found] = await Promise.all([
    searchWeb(query, topic),
    looksLikeDefinition(query) && topic ? wikipediaSummary(topic) : Promise.resolve(null),
  ]);
  const { results, limited } = search;
  const summary = found && relevant(found, topic) ? found : null;

  // Build context from live web search & Wikipedia summary (fresh live search prioritized)
  const contextPieces = [];
  for (const r of results.slice(0, 4)) {
    const body = r.text || r.snippet;
    if (body) contextPieces.push(`${r.title} (${r.domain}):\n${body.slice(0, 1200)}`);
  }
  if (summary) contextPieces.push(`Wikipedia (${summary.title}):\n${summary.text}`);
  const contextText = contextPieces.join('\n\n');

  if (contextText.length > 50 || fileContext) {
    const aiAnswer = await generateAI({
      question: resolvedFollowUp !== question ? `${question} (Context: regarding ${topic || resolvedFollowUp})` : question,
      context: fileContext + contextText,
      conversation: messages,
      model,
      onStatus: (s) => emit('status', s),
      onThought: (t) => emit('thought', { text: t }),
      onToken: (c) => emit('token', { text: c }),
    });
    if (aiAnswer) {
      return clean(aiAnswer);
    }
  }

  // If search was completely empty, still attempt direct AI generation for reasoning / general questions
  if (!results.length && !summary) {
    const directAi = await generateAI({
      question: resolvedFollowUp !== question ? `${question} (Context: regarding ${topic || resolvedFollowUp})` : question,
      context: fileContext,
      conversation: messages,
      model,
      onStatus: (s) => emit('status', s),
      onThought: (t) => emit('thought', { text: t }),
      onToken: (c) => emit('token', { text: c }),
    });
    if (directAi) return clean(directAi);

    return limited
      ? 'The search engine is throttling this machine right now, so I could not look that up. Give it a minute and ask again.'
      : "I couldn't find anything on that. Try rephrasing it, or give me a bit more to go on.";
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
  // Wikipedia's own prose is already written as an explanation, so its
  // sentences join the pool with a thumb on the scale rather than being
  // bolted on in front of it.
  if (summary) {
    const best = pool[0]?.score ?? 1;
    sentences(summary.text)
      .slice(0, 4)
      .forEach((raw, i) => {
        const sentence = tidy(raw);
        if (sentence.length < 25) return;
        const scored = scoreSentence(sentence, { idf, wantsNumber, weight: 1.2, position: i });
        pool.push({ sentence, score: Math.max(scored, best * (1.15 - i * 0.1)) });
      });
  }

  pool.sort((a, b) => b.score - a.score);

  if (!pool.length) {
    return 'I searched for that, but the pages that came back were mostly navigation and boilerplate. Try wording it differently.';
  }

  // The lead: the one sentence that most reads like the answer itself. It goes
  // first and alone, so the answer opens with the answer instead of with
  // background the reader has to wade through.
  const shape = shapeOf(query);
  const head = words(topic).at(-1);
  const asked = new Set(terms);
  let lead = pool[0];
  let bestRank = 0;
  pool.slice(0, 12).forEach((item) => {
    const rank = item.score * directness(item.sentence, shape, head, asked);
    if (rank > bestRank) {
      bestRank = rank;
      lead = item;
    }
  });

  const chosen = [lead.sentence];
  const seen = [new Set(words(lead.sentence))];

  for (const item of pool) {
    if (chosen.length >= wanted) break;
    if (item === lead) continue;
    const tokens = new Set(words(item.sentence));
    if (seen.some((other) => overlap(tokens, other) > 0.6)) continue;
    seen.push(tokens);
    chosen.push(item.sentence);
  }

  const full = chosen.map((s) => (/[.!?]$/.test(s) ? s : s + '.'));
  const text = clean([full[0], paragraphs(full.slice(1))].filter(Boolean).join('\n\n'));

  // Stream it out a word at a time, so the page fills in the way a reply would.
  emit('status', { text: 'Writing the answer' });
  for (const chunk of text.match(/\S+\s*/g) || []) emit('token', { text: chunk });
  return text;
}
