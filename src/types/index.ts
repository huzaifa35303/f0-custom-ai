export interface SearchSource {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  fullText?: string;
  author?: string;
  publishedDate?: string;
  score?: number;
}

export interface SearchQuery {
  query: string;
  purpose: string;
  timestamp: number;
  resultCount: number;
}

export interface FetchedPage {
  url: string;
  title: string;
  snippet: string;
  length: number;
  status: 'fetching' | 'fetched' | 'failed';
}

export interface SearchActivityStep {
  id: string;
  type: 'intent' | 'query' | 'search' | 'fetch' | 'verify' | 'synthesis';
  title: string;
  detail?: string;
  status: 'pending' | 'running' | 'done';
  timestamp: number;
}

export interface SearchTelemetry {
  decision: 'search' | 'direct';
  reason: string;
  queries: SearchQuery[];
  sources: SearchSource[];
  fetchedPages: FetchedPage[];
  steps: SearchActivityStep[];
  timeTakenMs: number;
  verifiedClaimCount?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  telemetry?: SearchTelemetry;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  isPinned?: boolean;
  systemPromptOverride?: string;
}

export type ThemeType = 'studio' | 'noir' | 'cyber' | 'editorial';
export type SearchModeType = 'smart' | 'force_search' | 'direct_only';
export type AIProviderType = 'builtin' | 'gemini' | 'openai' | 'custom';

export interface AppSettings {
  provider: AIProviderType;
  apiKey?: string;
  apiBaseUrl?: string;
  modelName?: string;
  searchMode: SearchModeType;
  maxQueries: number;
  theme: ThemeType;
  systemPrompt: string;
  autoVoice: boolean;
}
