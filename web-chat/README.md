# f0undr Ai

A ChatGPT-style chat interface that answers questions from live web search.

No language model, no API key, no account, no npm dependencies. Node's standard
library and the public web are the whole stack.

```bash
cd web-chat
npm start          # http://localhost:3000
```

Node 20 or newer. There is nothing to install.

---

## What it does

You type a question. The server searches the web, opens the top few results,
picks the sentences that best answer what you asked, and writes them back as a
short reply — streamed word by word, the way a chat reply arrives.

Answers are written as plain statements. No links, no URLs, no "according to",
no sources list. That is enforced in two places: the composer never puts a URL
into the text in the first place, and `lib/clean.js` strips any that survive
from the page text.

## Talking to it

Not everything is a search. Greetings, thanks, "how are you", "who made you",
"what can you do" and the like are answered straight from `lib/chat.js` and
never touch the network — searching the web for "how are you" is both slow and
wrong.

It answers in the language and script you wrote in: **English, Urdu, Hindi and
Punjabi**, in native script or in Latin letters. Write *tumhe kisne banaya* and
the reply comes back in Roman Urdu; write it in Nastaliq and so does the answer,
laid out right to left.

Asked who made it, f0undr Ai says it was created by **f0undr and the f0undr
Team**.

Intents about the assistant require the message to actually point at it, so
*"who made you"* is chat and *"who made Google"* is a search.

Anything that is a real question still goes to the web, in whatever language it
was asked.


## What it is not

There is no model here, so there is no reasoning, no writing, no translation and
no maths. It cannot summarise in its own words, because it has no words of its
own — every sentence in an answer came off a real page.

That makes it reliable for **facts** ("what is the population of Karachi",
"how does a heat pump work", "who runs OpenAI") and poor at anything open-ended
("write me an email", "which of these should I pick"). Answers about fast-moving
news read like a digest of headlines rather than a briefing.

It is also extractive, so an answer occasionally carries a sentence that is
true but beside the point. Nothing is invented — the failure mode is irrelevance,
not fabrication.

## Teaching it (the brain)

Tell it something and it keeps it:

```
remember: f0undr builds outbound lead generation systems for agencies
my name is Huzaifa
yaad rakho: mera kaam lead generation hai
```

Ask about it later and the answer comes from what you taught, not from the web
- you know your own business and a search result does not. Also understood:
`what do you know`, `forget: <thing>`, `forget everything`.

It lives in `brain.json` next to the code: plain JSON, yours, readable, hand
editable, and backed up by committing it. There is no model, so nothing is
learned statistically - "training" here means what it means to a person. You
tell it, it keeps it, it uses it.

## Commands about the last answer

An instruction is not a question. "give me list just" used to be searched for,
which returned gift-registry spam; these are now handled as text operations on
the reply above:

| You type | What happens |
|---|---|
| `give me a list`, `bullets` | the last answer as bullet points |
| `shorter`, `tldr`, `summary` | just its opening line |
| `more`, `aur batao` | the last question asked again, at twice the length |
| `repeat` | the last answer again |
| `translate`, `rewrite`, `simpler` | declined, and says why |

The last row is the honest limit. Rewording and translating mean writing new
sentences, and this app does not write sentences - it picks them off pages. A
command has to be six words or fewer, so "list of best AI models 2026" is still
a question.

## How an answer gets built

`lib/answer.js`, in order:

1. **Chat check** — `lib/chat.js` matches the message against the conversational
   intents, detects the language from its script or its words, and replies in
   kind. If it matches, nothing is searched.
2. **Brain check** — teaching, forgetting, or a question the brain already
   covers (`lib/brain.js`). Half the question's distinctive words have to
   appear in a stored fact, so a loose match cannot answer "what is Python"
   with something you said about your own project.
3. **Command check** — an instruction about the last answer (`lib/commands.js`).
2. **Search** — DuckDuckGo's no-JS HTML endpoint, falling back to the Wikipedia
   API if DuckDuckGo blocks the request or finds nothing.
3. **Read** — the top four results are fetched and reduced to plain text.
4. **Topic lookup** — for "what/who/where is X" questions, Wikipedia's own
   one-paragraph summary of X opens the answer, because it is already written as
   prose. The question is stripped to its subject first: searching Wikipedia for
   *"what is the capital of Australia"* matches the article **Question**.
   The article found is then checked against the subject before it is used.
5. **Carry the last question across** — a question leaning on the one before
   it ("how old is he", "when was it built", "why") borrows the earlier
   subject, so a follow-up searches for something the web can actually find.
   Only a pronoun or an opener like "what about" triggers this: judging by
   length would drag in "capital of France", which is short but self-contained.
6. **Score every sentence** — by how much of the question it covers, weighted so
   rarer words count for more (a crude idf over the fetched pages), with a boost
   for figures when the question asks for one, for sentences near the top of a
   page, and for `.gov`, `.edu` and Wikipedia.
7. **Throw out the furniture** — cookie banners, sign-up pitches, navigation
   strips, Title Case Headlines, cross-references, scraped table rows, embedded
   markup, and any sentence that is itself a question.
8. **Pick and de-duplicate** — the best sentences, skipping any that mostly
   repeats one already chosen.
9. **Lead with the answer** — one sentence is promoted to the front and set on
   its own. Scoring finds the sentences that are *about* the question; a second
   pass finds the one that *answers* it, preferring a date for "when", a figure
   for "how many", a name for "who", and in every case a sentence that opens by
   naming something the question did not already contain.
10. **Clean and stream** — strip links and attribution phrases, then emit the
   result word by word.

## Layout

```
server.js          HTTP server: static files, /api/chat (SSE), /api/health
ask.js             ask a question from the terminal
lib/chat.js        conversation: identity, small talk, four languages
lib/brain.js       what you have taught it, stored in brain.json
lib/commands.js    instructions about the last answer
lib/answer.js      scoring and composition — the part that decides what to say
lib/search.js      DuckDuckGo + Wikipedia, and page fetching
lib/clean.js       strips links and "according to" phrasing
lib/config.js      every tunable, all env-overridable
public/            the chat UI (one HTML file, one CSS file, one JS module)
```

## Trying it without the browser

```bash
node ask.js how does a heat pump work
```

Progress goes to stderr and the answer to stdout, so `node ask.js ... 2>/dev/null`
gives you just the reply.

## Configuration

Every value has a working default; set an environment variable to change one.

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `RESULTS` | `6` | Search results considered |
| `PAGES_PER_SEARCH` | `4` | How many of those are actually opened |
| `CHARS_PER_PAGE` | `12000` | Text kept per page |
| `MAX_SENTENCES` | `6` | Longest an answer can get |

## The API

`POST /api/chat` takes `{ messages: [{ role, content }] }` and replies with an
SSE stream. Only the last user message is used — there is no model to carry a
conversation forward, so earlier turns are accepted and ignored.

| Event | Meaning |
|---|---|
| `status` | Progress text: searching, reading, writing |
| `token` | The next piece of the answer |
| `final` | The finished answer, replacing everything streamed |
| `error` | Something failed; the text explains what |
| `done` | Stream over |

`GET /api/health` reports whether the search engine is reachable. The status pill
in the header reads from it.

## Notes

- **Nothing is cached.** Every question is a fresh search, so an answer is never
  stale, and a repeated question costs the same as the first one.
- **DuckDuckGo may rate-limit** a machine that asks very often. The Wikipedia
  fallback covers that case for general knowledge and not much else.
- **Page text is data, never instructions.** It is only ever scored and quoted,
  never executed or obeyed, so a page telling the reader to do something has no
  more effect than any other sentence — and the pitch filter usually drops it.
- **If you want reasoning back**, the place to add a model is `answer()`: keep
  steps 1–4 and hand the retrieved text to it instead of scoring sentences.
  `lib/search.js` already returns exactly the structure such a call would need.
- **Rate limiting is reported as itself.** Asked too often, DuckDuckGo answers
  with a challenge page rather than an error; the app recognises that and says
  it is being throttled instead of claiming the web had no answer. Wikipedia
  still answers in the meantime.
