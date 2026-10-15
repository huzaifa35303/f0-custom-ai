# Progress

## Status: working end to end

`npm start` in `web-chat/` serves the chat UI on port 3000. Verified in the
browser: greeting answered without a search, factual question answered from live
web results, no links and no attribution phrasing in the output.

## What changed along the way

The first build used Ollama with a real tool-calling loop (`lib/ollama.js`,
`lib/prompt.js`, a `web_search` tool schema, streamed tool calls). That was
dropped on the instruction not to use Ollama, a model or an API key. The answer
is now composed from retrieved page text by `lib/answer.js` with no model at
all. `lib/search.js` and `lib/clean.js` survived the change; the tool-loop files
were deleted.

The folder was originally `ollama-chat/` and was deleted from disk between
sessions. It was rebuilt as `web-chat/` from what was still in context.

## Decisions worth remembering

- **No dependencies at all** — Node's `http`, `fetch` and `fs` cover everything,
  so there is no install step and nothing to keep up to date.
- **No URLs reach the model layer or the screen.** The composer never emits one
  and `lib/clean.js` strips any that survive the page text.
- **Wikipedia is searched with the question's subject, not the question.**
  Searching the raw question matched the article *Question*. `subject()` strips
  the interrogative and `relevant()` checks the article actually matches.
- **Filters in `scoreSentence` are the quality knob.** Most tuning so far has
  been removing page furniture: cookie banners, sign-up pitches, headlines,
  cross-references, citations, table rows, embedded markup, FAQ questions.

## Conversation layer (lib/chat.js)

Added so the app is not only a search box. A phrasebook of intents - greeting,
how are you, name, creator, identity, capabilities, languages, thanks, bye,
help - each with trigger patterns and a reply per language.

- Languages: English, Roman Urdu/Hinglish, Hindi (Devanagari), Urdu (Nastaliq),
  Punjabi (Gurmukhi), Roman Punjabi. Script detection first, then romanized
  keyword lists; Punjabi markers are checked before Hindustani ones.
- Identity: created by f0undr and the f0undr Team.
- Intents about the assistant carry a `requires: SELF` guard. Without it
  "who made Google" was being answered as if it were about the assistant.
- Messages over 80 characters skip the phrasebook entirely.
- The UI sets `dir="auto"` per message so Urdu lays out right to left, and the
  font stack falls through to system Devanagari, Gurmukhi and Nastaliq faces,
  since Inter has no glyphs for them.

## Direct-answer lead and follow-ups

- `directness()` picks one sentence to open the answer: scoring finds what is
  about the question, this finds what answers it. Shape-aware (date for "when",
  figure for "how many", name for "who") plus a bonus for a sentence that opens
  by naming something the question did not contain - that is what moved
  "capital of Australia" from the ACT article to the Canberra sentence.
  Stem-matched, so "Australian" does not pass as a new name for "Australia".
- `resolveFollowUp()` folds the previous question's subject into a pronoun or
  fragment. Gated on a pronoun or an opener like "what about": a length rule
  grabbed self-contained short questions like "capital of France".
- `searchWeb()` now returns `{ results, limited }` and takes the stripped
  subject as a second argument. The Wikipedia fallback was being handed the raw
  question, which matches nothing - "who invented the thermos flask" found zero
  while "thermos flask" finds the article. That bug was invisible until
  DuckDuckGo started throttling and the fallback became the only path.
- DuckDuckGo throttling answers 202 with a challenge page, not an error. It is
  now detected and reported as throttling rather than as an empty web.

## Known weak spots

- "Latest news" questions read as a digest of headlines, not a briefing.
- Superlative and list questions ("tallest building") pull list-article intros
  before the actual answer.
- Occasional fragments: image captions and a page title glued to a sentence.
- Nothing open-ended works — no writing, reasoning, maths or translation.

## If picking this back up

The place to add a model back is `answer()` in `lib/answer.js`: keep the small
talk check, the search and the page reads, and hand the retrieved text to the
model instead of scoring sentences. `searchWeb()` already returns the structure
such a call needs.
