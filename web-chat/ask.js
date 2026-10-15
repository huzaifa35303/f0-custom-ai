// One-shot question from the terminal, for checking answers without the UI.
//   node ask.js who is the ceo of openai
import { answer } from './lib/answer.js';

const question = process.argv.slice(2).join(' ');
if (!question) {
  console.error('Usage: node ask.js <question>');
  process.exit(1);
}

const started = Date.now();
const text = await answer(question, (event, data) => {
  if (event === 'status') process.stderr.write(`… ${data.text}\n`);
});
console.log('\n' + text + '\n');
console.error(`(${((Date.now() - started) / 1000).toFixed(1)}s)`);
