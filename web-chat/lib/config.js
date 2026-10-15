export const config = {
  port: Number(process.env.PORT || 3000),
  // Results asked of the search engine, and how many of them we open and read.
  results: Number(process.env.RESULTS || 6),
  pagesPerSearch: Number(process.env.PAGES_PER_SEARCH || 4),
  charsPerPage: Number(process.env.CHARS_PER_PAGE || 12000),
  // Sentences the composed answer may use.
  maxSentences: Number(process.env.MAX_SENTENCES || 6),
  // Optional LangSearch API key for high-speed (100ms) web search.
  langsearchApiKey: process.env.LANGSEARCH_API_KEY || '',
};
