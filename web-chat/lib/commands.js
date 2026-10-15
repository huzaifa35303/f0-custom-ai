/**
 * Commands about the answer just given.
 *
 * "give me list just" is not a question about the world, it is an instruction
 * about the last reply — and searching the web for the word *list* returns
 * gift-registry spam. These are handled here instead: pure text operations on
 * the previous answer, which need no model and no network.
 *
 * What cannot be done is anything that requires understanding: rewriting in
 * other words, translating found text, drawing a conclusion. Those are refused
 * plainly rather than faked.
 */

const COMMANDS = [
  {
    name: 'list',
    test: /^(give me |just |only |make it |show (me )?|convert to |as )*(a |the )?(list|bullets?|bullet points?|points?)( just| only| form| mein| me)?$|^(list|bullet) (it|this|that)( out)?$|^listify$|^list do$|^points? (bana|banao|do)$/i,
  },
  {
    name: 'short',
    test: /^(make it |keep it |be |say it )?(short(er)?|brief(er)?|concise|summar(y|ise|ize)|tldr|tl;dr|in short|one line|short mein|chhota|chota)( karo| kar do| please)?$|^(just|only) the (answer|point|main point)$/i,
  },
  {
    name: 'more',
    test: /^(more|tell me more|more detail(s)?|go deeper|expand|elaborate|explain more|longer|aur batao|zyada batao|hor dasso)( please)?$/i,
  },
  {
    name: 'repeat',
    test: /^(repeat|say (that|it) again|again|come again|phir se|dobara)( please)?$/i,
  },
  {
    name: 'rewrite',
    test: /^(rewrite|rephrase|in your own words|simpler|explain simply|explain like i'?m \d+|eli5|in (urdu|hindi|punjabi|english)|urdu mein|hindi mein)( it| this| that)?( please)?$|^translate( it| this| that)?( (to|into|in) \w+)?( please)?$/i,
  },
];

/** Which command this is, or null when the message is a real question. */
export function detectCommand(message) {
  const text = message.trim().replace(/[.!?]+$/, '');
  // A command is a short aside. Anything longer is a question that happens to
  // contain one of these words.
  if (text.split(/\s+/).length > 6) return null;

  for (const command of COMMANDS) if (command.test.test(text)) return command.name;
  return null;
}

function sentencesOf(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);
}

/**
 * Run a command against the previous answer.
 *
 * Returns the new text, or `{ rerun: true }` for commands that need fresh
 * material rather than a reshuffle of what is already on screen.
 */
export function applyCommand(name, previousAnswer) {
  if (name === 'more' || name === 'rewrite') return { rerun: true };

  if (!previousAnswer) {
    return { text: 'There is nothing above to work on yet — ask me something first.' };
  }

  const lines = sentencesOf(previousAnswer);

  switch (name) {
    case 'list':
      return { text: lines.map((s) => `- ${s}`).join('\n') };

    case 'short':
      return { text: lines[0] || previousAnswer };

    case 'repeat':
      return { text: previousAnswer };

    default:
      return { text: previousAnswer };
  }
}
