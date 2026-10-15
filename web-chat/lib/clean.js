// Answers must read as plain knowledge: no links, and no "according to ..."
// framing. The text comes off real web pages, so both turn up often enough to
// be worth stripping before anything reaches the screen.

const LINK_PHRASES = new RegExp(
  String.raw`\b(according to|as (?:reported|stated|noted) (?:by|on|in)|` +
    String.raw`(?:as )?per (?:the )?(?:report|article|site|page)|sources say|reports indicate|` +
    String.raw`it is reported|based on (?:my |the )?(?:search|search results|web search)|` +
    String.raw`from (?:my |the )?(?:search results|web search)|` +
    String.raw`i found(?: that| on)?|the (?:website|page|article|source) (?:states|says|notes))\b`,
  'gi'
);

export function clean(text) {
  let out = text;

  // [label](https://…) -> label ; ![image](…) -> dropped
  out = out.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  out = out.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // <https://…>, bare URLs, bare www. addresses
  out = out.replace(/<https?:\/\/[^>]+>/gi, '');
  out = out.replace(/\(?\bhttps?:\/\/\S+\)?/gi, '');
  out = out.replace(/\(?\bwww\.[^\s)]+\)?/gi, '');

  // A trailing "Sources:" / "References:" block.
  out = out.replace(/\n+\s*(sources?|references?|citations?)\s*:?[\s\S]*$/i, '');

  // Sanitize any underlying model leaks so branding is always 100% f0undr Ai / genni 1
  out = out.replace(/\s*(?:and\s+)?powered by (?:the\s+)?OpenAI(?:\s+GPT-[\w.]+)?(?:\s+architecture)?/gi, '');
  out = out.replace(/\b(?:the\s+)?OpenAI GPT-[\w.]+(?:\s+architecture)?\b/gi, 'genni 1');
  out = out.replace(/\bOpenAI\b/gi, 'f0undr');

  // "According to Reuters, the rate fell" -> "The rate fell"
  out = out.replace(
    new RegExp(`(^|[.!?]\\s+|\\n)(?:${LINK_PHRASES.source})([^,.\\n]{0,40}),\\s*`, 'gi'),
    '$1'
  );
  out = out.replace(LINK_PHRASES, '');

  // Tidy up what the removals left behind.
  out = out.replace(/[ \t]{2,}/g, ' ');
  out = out.replace(/\(\s*\)/g, '');
  out = out.replace(/,\s*(?=[.!?;:,])/g, '');
  out = out.replace(/\s+([,.;:!?])/g, '$1');
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.trim();

  // Re-capitalise a sentence whose opening phrase we just deleted.
  out = out.replace(/(^|[.!?]\s+|\n)([a-z])/g, (_, lead, ch) => lead + ch.toUpperCase());

  return out;
}
