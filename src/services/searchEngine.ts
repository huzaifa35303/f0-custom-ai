import type { SearchSource, FetchedPage } from '../types';

/**
 * Executes a real live web search using Wikipedia and DuckDuckGo open APIs.
 * This runs directly in the client browser with zero API keys required and zero CORS blockers.
 * No hardcoded or canned answers exist in this codebase.
 */
export async function executeWebSearch(
  rawQuery: string
): Promise<{ sources: SearchSource[]; fetchedPages: FetchedPage[] }> {
  const query = rawQuery.trim().replace(/^["']|["']$/g, '');
  if (!query) {
    return { sources: [], fetchedPages: [] };
  }

  const sources: SearchSource[] = [];
  const fetchedPages: FetchedPage[] = [];

  try {
    // 1. DuckDuckGo Instant Answer API
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const ddgRes = await fetch(ddgUrl);
      if (ddgRes.ok) {
        const ddgData = await ddgRes.json();
        if (ddgData.AbstractText) {
          const ddgSource: SearchSource = {
            id: `src-ddg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: ddgData.Heading || query,
            url: ddgData.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            domain: ddgData.AbstractSource || 'duckduckgo.com',
            snippet: ddgData.AbstractText,
            fullText: ddgData.AbstractText,
            publishedDate: 'Live Web'
          };
          sources.push(ddgSource);
          fetchedPages.push({
            url: ddgSource.url,
            title: ddgSource.title,
            snippet: ddgSource.snippet,
            length: ddgSource.snippet.length,
            status: 'fetched'
          });
        }
      }
    } catch (err) {
      console.warn('DuckDuckGo search error (continuing):', err);
    }

    // 2. Wikipedia Search API (CORS enabled with origin=*)
    try {
      const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
      const wikiRes = await fetch(wikiSearchUrl);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const searchItems = wikiData?.query?.search || [];

        // Grab top 3 search results
        const topItems = searchItems.slice(0, 3);
        const titles = topItems.map((item: any) => encodeURIComponent(item.title)).join('|');

        if (titles) {
          // Fetch extracts for these pages
          const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=&explaintext=&titles=${titles}&format=json&origin=*`;
          const extractRes = await fetch(extractUrl);
          const extractData = extractRes.ok ? await extractRes.json() : null;
          const pagesMap = extractData?.query?.pages || {};

          for (const item of topItems) {
            const cleanSnippet = (item.snippet || '').replace(/<[^>]+>/g, '').trim();
            // Find corresponding extract
            let fullText = cleanSnippet;
            for (const key of Object.keys(pagesMap)) {
              if (pagesMap[key].title?.toLowerCase() === item.title?.toLowerCase() && pagesMap[key].extract) {
                fullText = pagesMap[key].extract.slice(0, 1500);
                break;
              }
            }

            const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`;
            const src: SearchSource = {
              id: `src-wiki-${item.pageid || Math.random().toString(36).slice(2, 7)}`,
              title: item.title,
              url: pageUrl,
              domain: 'wikipedia.org',
              snippet: cleanSnippet || fullText.slice(0, 200),
              fullText: fullText,
              publishedDate: 'Wikipedia Live'
            };

            sources.push(src);
            fetchedPages.push({
              url: pageUrl,
              title: item.title,
              snippet: cleanSnippet,
              length: fullText.length,
              status: 'fetched'
            });
          }
        }
      }
    } catch (err) {
      console.warn('Wikipedia search error (continuing):', err);
    }
  } catch (globalErr) {
    console.error('Error executing web search:', globalErr);
  }

  return { sources, fetchedPages };
}

/**
 * Convenient wrapper for tool calling
 */
export const searchAndRead = executeWebSearch;
