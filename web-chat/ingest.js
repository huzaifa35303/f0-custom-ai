// Load a document into the brain.
//
//   node ingest.js ../knowledge/pakistan.txt
//   node ingest.js ../knowledge/*.txt
//
// Accepts .txt and .md (one fact per line, # comments ignored), .json (an
// array of strings, or of objects with a text field) and .csv/.tsv (two
// columns, read as "<label> is <value>").
//
// PDF and Word are not handled: parsing them needs a library, and this app has
// no dependencies. Save them as .txt first.
import { readFile } from 'node:fs/promises';
import { extname, basename } from 'node:path';
import { teachMany } from './lib/brain.js';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node ingest.js <file> [file...]');
  console.error('Formats: .txt .md .json .csv .tsv');
  process.exit(1);
}

/** A list of facts, whatever the file looked like. */
function parse(text, kind) {
  if (kind === '.json') {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('JSON must be an array');
    return data.map((item) => (typeof item === 'string' ? item : item?.text)).filter(Boolean);
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  if (kind === '.csv' || kind === '.tsv') {
    const separator = kind === '.tsv' ? '\t' : ',';
    return lines.map((line) => {
      const [label, ...rest] = line.split(separator);
      const value = rest.join(separator).trim().replace(/^"|"$/g, '');
      return value ? `${label.trim().replace(/^"|"$/g, '')} is ${value}` : label.trim();
    });
  }

  // .txt and .md: headings and list bullets are stripped, the rest is a fact.
  return lines
    .map((line) => line.replace(/^[-*>]\s+/, '').replace(/^#+\s+/, ''))
    .filter(Boolean);
}

for (const file of files) {
  const kind = extname(file).toLowerCase();
  if (['.pdf', '.docx', '.doc'].includes(kind)) {
    console.error(`${basename(file)}: ${kind} needs a library to read. Save it as .txt first.`);
    process.exitCode = 1;
    continue;
  }

  try {
    const facts = parse(await readFile(file, 'utf8'), kind);
    if (!facts.length) {
      console.error(`${basename(file)}: nothing to load`);
      continue;
    }
    const { added, replaced, total } = await teachMany(facts);
    console.log(
      `${basename(file)}: ${added} added, ${replaced} updated — the brain now holds ${total}.`
    );
  } catch (err) {
    console.error(`${basename(file)}: ${err.message}`);
    process.exitCode = 1;
  }
}
