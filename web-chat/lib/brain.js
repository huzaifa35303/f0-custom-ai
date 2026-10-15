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

/** A statement about the person, which is worth keeping without being told. */
const ABOUT_ME = /^(my name is|i am called|i'm called|mera naam|main|i work at|i run|my company is)\b/i;

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

  // "my name is Huzaifa" is worth keeping even without the word "remember".
  if (ABOUT_ME.test(text) && text.split(/\s+/).length <= 12 && !text.includes('?')) {
    return { kind: 'teach', payload: text };
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

async function execute({ kind, payload }) {
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
    return `Got it — I will remember that.`;
  }

  return null;
}

/**
 * Facts worth using for this question, best first.
 *
 * The bar is deliberately high: half the question's distinctive words have to
 * appear in the fact. A loose match would answer "what is Python" with
 * something you once said about your own project.
 */
export async function recall(question) {
  const asked = keywords(question);
  if (!asked.length) return [];

  const facts = await load();
  const scored = [];

  for (const fact of facts) {
    const hits = asked.filter((w) => fact.keywords.includes(w));
    const coverage = hits.length / asked.length;
    if (coverage >= 0.5) scored.push({ fact, coverage });
  }

  return scored
    .sort((a, b) => b.coverage - a.coverage)
    .slice(0, 3)
    .map((s) => s.fact.text);
}
