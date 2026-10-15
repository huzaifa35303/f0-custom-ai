import type {
  AppSettings,
  ChatMessage,
  SearchTelemetry,
  SearchActivityStep,
  SearchSource,
  FetchedPage,
  SearchModeType
} from '../types';
import { executeWebSearch } from './searchEngine';
import {
  formatSystemPrompt,
  OPENAI_WEB_SEARCH_TOOL,
  GEMINI_WEB_SEARCH_TOOL
} from '../utils/systemPrompt';

export interface StreamCallbacks {
  onStepUpdate?: (step: SearchActivityStep) => void;
  onTelemetryReady?: (telemetry: SearchTelemetry) => void;
  onContentChunk?: (chunk: string, fullText: string) => void;
  onComplete?: (finalMessage: ChatMessage) => void;
  onError?: (err: Error) => void;
}

/**
 * Evaluates whether a prompt needs a live web search or can be answered directly.
 * Greetings and small talk are NEVER searched.
 */
export function shouldSearch(userPrompt: string, searchMode: SearchModeType): boolean {
  if (searchMode === 'direct_only') return false;
  if (searchMode === 'force_search') return true;

  const clean = userPrompt.trim();
  const lower = clean.toLowerCase();

  // Greetings & small talk (English, Urdu, Roman Urdu, casual)
  const greetingRegex = /^(aoa|salam|slam|assalam\s*o?\s*alaikum|aslam\s*o?\s*alaikum|asalamualaikum|assalamualaikum|hi|hello|hey|heya|howdy|sup|yo|kese\s*ho|kaise\s*ho|kia\s*hal\s*hai|kya\s*hal\s*hai|theek\s*ho|sab\s*khairiat|thanks|thank\s*you|shukriya|thx|ok|okay|accha|achha|theek|bye|goodbye|cya|take\s*care)[!?.]*$/i;
  if (greetingRegex.test(lower)) {
    return false;
  }

  const smallTalkStarts = [
    'aoa', 'salam', 'assalam', 'hi ', 'hello ', 'hey ', 'how are you',
    'kese ho', 'kaise ho', 'kia hal', 'kya hal', 'thank you', 'thanks', 'shukriya'
  ];
  if (smallTalkStarts.some(st => lower.startsWith(st)) && clean.split(/\s+/).length <= 4) {
    return false;
  }

  // Stable knowledge: math, coding, general explanations, writing, advice
  const stablePatterns = [
    'write an essay', 'write a poem', 'write a story', 'help me brainstorm', 'translate',
    'what do you think', 'give me advice', 'explain math', 'calculate', 'derive',
    'quicksort', 'binary search', 'fibonacci', 'write a function', 'write a python',
    'how to center a div', 'concept of', 'history of ancient'
  ];
  if (stablePatterns.some(p => lower.includes(p)) &&
      !lower.includes('latest') &&
      !lower.includes('today') &&
      !lower.includes('current') &&
      !lower.includes('2026')) {
    return false;
  }

  // Temporal facts, news, prices, scores, weather, latest versions, current office holders, unfamiliar names
  const searchTriggers = [
    'latest', 'current', 'today', 'now', 'still', 'recent', 'newest',
    'price', 'prices', 'stock', 'market cap', 'score', 'scores', 'match',
    'weather', 'version', 'versions', 'release', 'releases', 'released', 'update',
    'who is the current', 'who is current', 'who is ceo', 'who currently holds',
    '2025', '2026', 'roadmap', 'election', 'championship', 'vs', 'versus', 'compare'
  ];

  return searchTriggers.some(st => lower.includes(st));
}

export async function processAssistantResponse(
  userPrompt: string,
  history: ChatMessage[],
  settings: AppSettings,
  callbacks: StreamCallbacks
): Promise<ChatMessage> {
  const cleanPrompt = userPrompt.trim();
  const lowerPrompt = cleanPrompt.toLowerCase();
  const wantsCitations = /\b(sources?|links?|citations?|references?|urls?)\b/i.test(lowerPrompt);

  try {
    const needsWebSearch = shouldSearch(cleanPrompt, settings.searchMode);
    let sources: SearchSource[] = [];
    let fetchedPages: FetchedPage[] = [];
    let telemetry: SearchTelemetry | undefined = undefined;

    // Step 1: Perform live search if needed (Zero API keys required)
    if (needsWebSearch) {
      callbacks.onStepUpdate?.({
        id: `step-${Date.now()}`,
        type: 'search',
        title: `Searching the web for "${cleanPrompt}"`,
        status: 'running',
        timestamp: Date.now()
      });

      const searchResult = await executeWebSearch(cleanPrompt);
      sources = searchResult.sources;
      fetchedPages = searchResult.fetchedPages;

      telemetry = {
        decision: 'search',
        reason: 'Temporal or current fact inquiry',
        queries: [{ query: cleanPrompt, purpose: 'web_search', timestamp: Date.now(), resultCount: sources.length }],
        sources,
        fetchedPages,
        steps: [],
        timeTakenMs: 400
      };

      callbacks.onTelemetryReady?.(telemetry);
    }

    // Step 2: Generate natural ChatGPT-style answer (Zero API keys required by default)
    let answerText = '';

    // Check if user has their own custom API key (Gemini / OpenAI)
    if (settings.apiKey && settings.apiKey.trim()) {
      if (settings.provider === 'gemini') {
        answerText = await callGeminiWithOptionalSearch(cleanPrompt, history, sources, settings, wantsCitations, callbacks);
      } else {
        answerText = await callOpenAIWithOptionalSearch(cleanPrompt, history, sources, settings, wantsCitations, callbacks);
      }
    } else {
      // 100% Free, Zero-API-Key live LLM provider (Pollinations.ai open endpoint)
      answerText = await callFreeZeroKeyLLM(cleanPrompt, history, sources, settings, wantsCitations, callbacks);
    }

    const finalMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: answerText,
      timestamp: Date.now(),
      telemetry: (telemetry && telemetry.sources.length > 0) ? telemetry : undefined
    };

    callbacks.onComplete?.(finalMsg);
    return finalMsg;
  } catch (error: any) {
    console.error('Execution error:', error);
    callbacks.onError?.(error);
    const fallbackText = `I ran into a temporary issue retrieving that. Please try asking again!`;
    const finalMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: fallbackText,
      timestamp: Date.now()
    };
    callbacks.onComplete?.(finalMsg);
    return finalMsg;
  }
}

/**
 * 100% Free, Zero-API-Key Live AI Provider (Pollinations.ai OpenAI-compatible endpoint)
 * Requires NO signup, NO credit card, and NO API key.
 */
async function callFreeZeroKeyLLM(
  userPrompt: string,
  history: ChatMessage[],
  sources: SearchSource[],
  settings: AppSettings,
  wantsCitations: boolean,
  callbacks: StreamCallbacks
): Promise<string> {
  const activePrompt = formatSystemPrompt(settings.systemPrompt);

  let systemContent = activePrompt;
  if (sources.length > 0) {
    const sourcesSummary = sources.map(s => `- Title: ${s.title}\n  Summary: ${s.fullText || s.snippet}`).join('\n\n');
    systemContent += `\n\n## Search Grounding Available:\n${sourcesSummary}\n\nInstructions:\n- Synthesize these live search findings seamlessly into your own words.\n- Do NOT say "according to...", "based on the search results...", or "the website says...".\n${wantsCitations ? '- The user explicitly requested sources, so you may list references at the bottom.' : '- Do NOT include links, URLs, source names, or citations.'}\n- For time-sensitive facts, mention the date naturally ("as of October 2026").`;
  }

  const messages = [
    { role: 'system', content: systemContent },
    ...history.slice(-6).map(m => ({
      role: m.role,
      content: m.content
    })),
    { role: 'user', content: userPrompt }
  ];

  try {
    const res = await fetch('https://text.pollinations.ai/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai',
        messages,
        stream: true
      })
    });

    if (!res.ok) {
      throw new Error(`Public AI endpoint responded with status ${res.status}`);
    }

    // Stream SSE chunks directly to the UI
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (reader) {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ') && !trimmed.includes('[DONE]')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                fullText += token;
                callbacks.onContentChunk?.(token, fullText);
              }
            } catch {}
          }
        }
      }
    }

    return fullText.trim();
  } catch (err) {
    console.warn('Streaming error, falling back to non-streaming:', err);
    // Non-streaming fallback
    const fallbackRes = await fetch('https://text.pollinations.ai/openai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai', messages })
    });
    const json = await fallbackRes.json();
    const content = json.choices?.[0]?.message?.content || '';
    await streamWords(content, callbacks);
    return content;
  }
}

/**
 * Optional Google Gemini Integration (if user enters their key)
 */
async function callGeminiWithOptionalSearch(
  userPrompt: string,
  history: ChatMessage[],
  sources: SearchSource[],
  settings: AppSettings,
  wantsCitations: boolean,
  callbacks: StreamCallbacks
): Promise<string> {
  const activePrompt = formatSystemPrompt(settings.systemPrompt);
  const modelName = settings.modelName || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${settings.apiKey}`;

  let promptInstruction = activePrompt;
  if (sources.length > 0) {
    promptInstruction += `\n\nLive Search Grounding:\n${sources.map(s => `${s.title}: ${s.snippet}`).join('\n\n')}\n\nSynthesize in your own words without saying "according to" or "the search says".`;
  }

  const payload = {
    system_instruction: { parts: [{ text: promptInstruction }] },
    contents: [
      ...history.slice(-6).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      { role: 'user', parts: [{ text: userPrompt }] }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`Gemini API Error ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  await streamWords(text, callbacks);
  return text;
}

/**
 * Optional OpenAI Integration (if user enters their key)
 */
async function callOpenAIWithOptionalSearch(
  userPrompt: string,
  history: ChatMessage[],
  sources: SearchSource[],
  settings: AppSettings,
  wantsCitations: boolean,
  callbacks: StreamCallbacks
): Promise<string> {
  const activePrompt = formatSystemPrompt(settings.systemPrompt);
  const baseUrl = settings.apiBaseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1';
  const model = settings.modelName || 'gpt-4o-mini';

  let systemContent = activePrompt;
  if (sources.length > 0) {
    systemContent += `\n\nLive Search Grounding:\n${sources.map(s => `${s.title}: ${s.snippet}`).join('\n\n')}`;
  }

  const messages = [
    { role: 'system', content: systemContent },
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userPrompt }
  ];

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({ model, messages, temperature: 0.7 })
  });

  if (!res.ok) throw new Error(`OpenAI API Error ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  await streamWords(text, callbacks);
  return text;
}

async function streamWords(text: string, callbacks: StreamCallbacks): Promise<void> {
  const tokens = text.split(/(\s+)/);
  let accumulated = '';
  for (let i = 0; i < tokens.length; i++) {
    accumulated += tokens[i];
    callbacks.onContentChunk?.(tokens[i], accumulated);
    if (i % 4 === 0) {
      await new Promise(r => setTimeout(r, 12));
    }
  }
}
