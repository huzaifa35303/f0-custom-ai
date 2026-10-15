import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * The brain: things you have taught it.
 *
 * Without a model there is no learning in the statistical sense, so "training"
 * here means what it means to a person — you tell it something, it keeps it,
 * and it uses it next time instead of going to the web. Facts you teach always
 * beat anything found online, because you know your own business and a search
 * result does not.
 *
 * Stored as plain JSON next to the code, so the knowledge is yours, readable,
 * editable by hand, and backed up by committing it.
 */

// BRAIN_FILE lets a deployment point this at writable storage. On a serverless
// host the application directory is read-only, so without it nothing can be
// taught — which the save path reports rather than failing silently.
const FILE = process.env.BRAIN_FILE || fileURLToPath(new URL('../brain.json', import.meta.url));

const STOPWORDS = new Set(
  `a an the and or but of in on at to for from by with about is are was were be been am do does did
   have has had can could should would will may might must i you he she it we they me my your our their
   what which who whom when where why how that this these those not no yes if then than so as`
    .split(/\s+/)
    .filter(Boolean)
);

function keywords(text) {
  return [
    ...new Set(
      (text.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) || []).filter(
        (w) => w.length > 2 && !STOPWORDS.has(w)
      )
    ),
  ];
}

async function load() {
  try {
    return JSON.parse(await readFile(FILE, 'utf8'));
  } catch {
    return [];
  }
}

class ReadOnlyBrain extends Error {}

// Written to a temporary file and moved into place, so a crash mid-write
// cannot leave the brain truncated.
async function save(facts) {
  const temp = `${FILE}.tmp`;
  try {
    await writeFile(temp, JSON.stringify(facts, null, 2), 'utf8');
    await rename(temp, FILE);
  } catch (err) {
    if (['EROFS', 'EACCES', 'EPERM', 'ENOENT'].includes(err.code)) throw new ReadOnlyBrain();
    throw err;
  }
}

const CANNOT_SAVE =
  "I can't save anything here — this copy is running somewhere with a read-only disk, " +
  'so nothing I learn would survive. Run it on your own machine and teaching works.';

// ------------------------------------------------------------- the commands

const TEACH =
  /^(remember|note|learn|save|store|keep in mind|fyi|yaad rakho|yaad rakhna|note karo|save karo)\b[:,\s-]+(.+)$/is;

const FORGET = /^(forget|delete|remove|bhool ja(o|na))\b[:,\s-]+(.+)$/is;

const FORGET_ALL =
  /^(forget everything|forget all|clear (your )?(brain|memory)|wipe (your )?memory|sab bhool ja(o|na))$/i;

const RECITE =
  /^(what do you know|what have (i|you) (taught|learned)|show (me )?(your )?(brain|memory|facts)|list (your )?(facts|memory)|tumhe kya pata hai)\??$/i;

/**
 * A statement about the person talking.
 *
 * "i am ur father" is not a question, so searching the web for it was never
 * going to work — it came back with pages about fathers. Anything someone says
 * about themselves is kept instead, which is what "remember:" does, without
 * having to say the word.
 */
const ABOUT_ME =
  /^(i am|i'?m|im|my name is|i am called|i'?m called|i like|i love|i hate|i live|i work|i study|i have|i own|i run|my \w+ is|mera |meri |mere |main |mai |mujhe )/i;

// "I am looking for a hotel" is a request, not a fact about the person, and
// belongs on the web like any other question.
const ASKING =
  /\b(looking for|look for|want|wanna|need|searching|search for|trying to find|wondering|can you|could you|help me|tell me|show me|find me)\b/i;

// Statements about the assistant rather than about the person. Nothing worth
// storing, but nothing worth searching for either.
// Either with a verb ("you are great") or in the contracted form that leaves
// it out ("ur amazing"), which is how it usually arrives.
const ABOUT_YOU =
  /^(you|you'?re|ur|u)\s+(are|r|is|were|look|seem|sound|rock|suck|rule)\b|^(you'?re|ur)\s+\w+\s*$/i;

/**
 * Is this message about the brain rather than a question for it?
 * Returns { kind, payload } or null.
 */
export function detectBrainCommand(message) {
  const text = message.trim();

  if (FORGET_ALL.test(text)) return { kind: 'forgetAll' };
  if (RECITE.test(text)) return { kind: 'recite' };

  const forget = text.match(FORGET);
  if (forget) return { kind: 'forget', payload: forget[3].trim() };

  const teach = text.match(TEACH);
  if (teach) return { kind: 'teach', payload: teach[2].trim() };

  const statement = !text.includes('?') && text.split(/\s+/).length <= 14;

  if (statement && ABOUT_YOU.test(text)) return { kind: 'aboutYou' };

  // "my name is Huzaifa" is worth keeping even without the word "remember".
  if (statement && ABOUT_ME.test(text) && !ASKING.test(text)) {
    return { kind: 'teach', payload: text, personal: true };
  }

  return null;
}

export async function runBrainCommand(command) {
  try {
    return await execute(command);
  } catch (err) {
    if (err instanceof ReadOnlyBrain) return CANNOT_SAVE;
    throw err;
  }
}

async function execute({ kind, payload, personal }) {
  if (kind === 'aboutYou') return 'Noted. What would you like to know?';

  const facts = await load();

  if (kind === 'forgetAll') {
    await save([]);
    return facts.length
      ? `Forgotten — all ${facts.length} ${facts.length === 1 ? 'thing' : 'things'} I knew are gone.`
      : 'There was nothing stored to forget.';
  }

  if (kind === 'recite') {
    if (!facts.length) {
      return 'Nothing yet. Tell me something starting with "remember:" and I will keep it.';
    }
    return [
      `Here is everything you have taught me (${facts.length}):`,
      '',
      ...facts.map((f) => `- ${f.text}`),
    ].join('\n');
  }

  if (kind === 'forget') {
    const wanted = keywords(payload);
    const kept = facts.filter(
      (f) => !wanted.length || !wanted.every((w) => f.keywords.includes(w))
    );
    const gone = facts.length - kept.length;
    if (!gone) return `I could not find anything about "${payload}" to forget.`;
    await save(kept);
    return `Forgotten ${gone} ${gone === 1 ? 'thing' : 'things'} about that.`;
  }

  if (kind === 'teach') {
    const text = payload.replace(/\s+/g, ' ').trim();
    if (text.length < 3) return 'There was nothing to remember in that.';

    const words = keywords(text);
    // Replace rather than duplicate when the same ground is covered again.
    const facts2 = facts.filter(
      (f) => !(words.length && words.every((w) => f.keywords.includes(w)))
    );
    facts2.push({ text, keywords: words, addedAt: new Date().toISOString() });
    await save(facts2);
    return personal ? "Noted — I'll remember that about you." : 'Got it — I will remember that.';
  }

  return null;
}

/**
 * Add many facts at once, for loading a document.
 *
 * One save at the end rather than one per fact: teaching them one at a time
 * would rewrite the file for every line.
 */
export async function teachMany(lines) {
  const facts = await load();
  let added = 0;
  let replaced = 0;

  for (const line of lines) {
    const text = String(line).replace(/\s+/g, ' ').trim();
    if (text.length < 3) continue;

    const words = keywords(text);
    if (!words.length) continue;

    const before = facts.length;
    // Same ground covered again replaces the earlier wording.
    const kept = facts.filter((f) => !words.every((w) => f.keywords.includes(w)));
    facts.length = 0;
    facts.push(...kept, { text, keywords: words, addedAt: new Date().toISOString() });
    if (facts.length === before) replaced++;
    else added++;
  }

  await save(facts);
  return { added, replaced, total: facts.length };
}

/**
 * Words that narrow which fact is meant. A fact carrying one of these that the
 * question did not ask for is answering a different question: "the first
 * FEMALE prime minister" is not the answer to "who was the first prime
 * minister", though it shares every other word.
 */
const QUALIFIERS = new Set(
  `first second third last former current acting deputy female male largest
   smallest biggest highest lowest longest shortest oldest newest official
   national maximum minimum total average`.split(/\s+/)
);

/**
 * Facts worth using for this question, best first.
 *
 * The bar is deliberately high: three quarters of the question's distinctive
 * words have to appear in the fact. A loose match would answer "what is
 * Python" with something you once said about your own project, and at half it
 * padded every answer with its neighbours - asking for the national animal
 * also returned the national sport.
 */
export async function recall(question) {
  const asked = keywords(question);
  if (!asked.length) return [];

  const wanted = new Set(asked);
  const facts = await load();
  const scored = [];

  for (const fact of facts) {
    const hits = asked.filter((w) => fact.keywords.includes(w));
    const coverage = hits.length / asked.length;
    if (coverage < 0.75) continue;

    // Among equally covering facts, prefer the one saying least that was not
    // asked about, and penalise an unasked qualifier hardest of all.
    const extra = fact.keywords.filter((w) => !wanted.has(w));
    const unasked = extra.filter((w) => QUALIFIERS.has(w)).length;
    const score = coverage - unasked * 0.3 - extra.length * 0.01;
    scored.push({ fact, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((s) => s.fact.text);
}
