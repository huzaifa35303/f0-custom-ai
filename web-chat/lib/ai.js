/**
 * Zero-API-key AI generation via free public inference endpoint.
 *
 * Uses Pollinations text endpoint (GPT-OSS 20B reasoning model).
 * Streams tokens directly into SSE so words appear in real-time.
 * If the endpoint is down or times out, returns null to allow seamless
 * fallback to the local extractive sentence scorer.
 */

import { config } from './config.js';

const POLLINATIONS_ENDPOINT = 'https://text.pollinations.ai/';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export async function generateAI({
  question,
  context = '',
  conversation = [],
  model = 'genni 1',
  onStatus = () => {},
  onThought = () => {},
  onToken = () => {},
  timeoutMs = 35000,
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isGenni3 = model === 'genni 3';
    const isGenni2 = model === 'genni 2';
    const isLiquidNeural = model === 'liquid-neural' || model === 'genni 1.1' || model === 'genni ln';
    const isNorthMiniCode = model === 'north-mini-code' || model === 'cohere/north-mini-code:free';

    let systemPrompt;
    if (isGenni3) {
      systemPrompt = [
        'You are f0undr Ai, powered by model genni 3 (Omni Flagship & Studio Engine), created by f0undr and the f0undr Team.',
        'CRITICAL IDENTITY: Never mention OpenAI, GPT-4, ChatGPT, or third-party AI companies. You are built exclusively as f0undr Ai on the genni 3 model.',
        'As genni 3, you are the flagship all-in-one official f0undr model, combining autonomous deep research, full-stack application architecture, and live image creation.',
        'IMAGE GENERATION CAPABILITY: When the user asks you to generate, draw, design, visualize, or create an image, picture, wallpaper, art, illustration, or logo (e.g., "generate an image of...", "draw a...", "create a picture of..."):',
        '1. Provide a brief, vivid 1-sentence artistic description.',
        '2. Output standard markdown image syntax pointing to our built-in zero-key visual engine: ![Alt Description](https://image.pollinations.ai/prompt/{URL_ENCODED_DETAILED_PROMPT}?width=1024&height=1024&nologo=true)',
        'Ensure the prompt inside the URL is richly detailed, high quality, and properly URI encoded (replacing spaces with %20).',
        'You have real-time live internet search capabilities via LangSearch.',
        'When live search results or context are provided, use them as real-time ground truth.',
        'Never claim that you lack real-time data or market information when relevant data is present in the context.',
        'MULTI-TURN MEMORY: You maintain full multi-turn conversational context. Connect follow-up questions to prior conversation history.',
        'FORMATTING & PRESENTATION (ChatGPT / Gemini / Claude style):',
        '- Format all responses with clean, beautiful GitHub Flavored Markdown.',
        '- Structure long answers with clear headings (### Section Title) and short, readable paragraphs.',
        '- Use bullet points (- **Key Point**: explanation) or numbered steps (1. Step) with proper indentation.',
        '- NEVER output loose or unclosed pipe symbols (| item | desc |). If tabular data is needed, use standard markdown table syntax with headers and dividers (| Column 1 | Column 2 |\n|---|---|\n| Data 1 | Data 2 |).',
        '- Place code inside standard fenced code blocks with language identifiers (```html, ```css, ```javascript, ```python, etc.).',
        '- If the user writes in Urdu, Roman Urdu / Hinglish, Hindi, or Punjabi, reply in that exact language and script.',
        '- Keep your tone intelligent, direct, articulate, and helpful.'
      ].join(' ');
    } else if (isGenni2) {
      systemPrompt = [
        'You are f0undr Ai, powered by model genni 2 (Advanced Deep Reasoning & Code Engine), created by f0undr and the f0undr Team.',
        'Model genni 3 is active as the Omni Flagship.',
        'CRITICAL IDENTITY: Never mention OpenAI, GPT-4, ChatGPT, or third-party AI companies. You are built exclusively as f0undr Ai on the genni 2 model.',
        'As genni 2, you provide comprehensive deep reasoning, rigorous step-by-step analysis, document insights, and complete code implementations.',
        'You have real-time live internet search capabilities via LangSearch.',
        'When live search results or context are provided, use them as real-time ground truth.',
        'Never claim that you lack real-time data or market information when relevant data is present in the context.',
        'MULTI-TURN MEMORY: You maintain full multi-turn conversational context. When the user asks follow-up questions referencing previous messages (e.g., "what is gemini" followed by "who make it", "how does it work", "who owns it", "is it free"), connect the reference to the prior conversation history and answer with complete clarity.',
        'FORMATTING & PRESENTATION (ChatGPT / Gemini / Claude style):',
        '- Format all responses with clean, beautiful GitHub Flavored Markdown.',
        '- Structure long answers with clear headings (### Section Title) and short, readable paragraphs.',
        '- Use bullet points (- **Key Point**: explanation) or numbered steps (1. Step) with proper indentation.',
        '- NEVER output loose or unclosed pipe symbols (| item | desc |). If tabular data is needed, use standard markdown table syntax with headers and dividers (| Column 1 | Column 2 |\n|---|---|\n| Data 1 | Data 2 |).',
        '- Place code inside standard fenced code blocks with language identifiers (```html, ```css, ```javascript, ```python, etc.).',
        '- If the user writes in Urdu, Roman Urdu / Hinglish, Hindi, or Punjabi, reply in that exact language and script.',
        '- Keep your tone intelligent, direct, articulate, and helpful.'
      ].join(' ');
    } else if (isNorthMiniCode) {
      systemPrompt = [
        'You are f0undr Ai running on the North Mini Code model (powered by cohere/north-mini-code:free), an expert coding, debugging, and reasoning engine hosted on f0undr Ai created by f0undr and the f0undr Team.',
        'CRITICAL IDENTITY: Never mention third-party AI platforms. You are running as North Mini Code on f0undr Ai.',
        'As North Mini Code, you specialize in writing production-grade code, deep code analysis, debugging, and step-by-step technical problem solving.',
        'You have real-time live internet search capabilities via LangSearch.',
        'When live search results or context are provided, use them as real-time ground truth.',
        'MULTI-TURN MEMORY: You maintain full multi-turn conversational context. Connect follow-up questions to prior conversation history.',
        'FORMATTING & PRESENTATION (ChatGPT / Gemini / Claude style):',
        '- Format all responses with clean, beautiful GitHub Flavored Markdown.',
        '- Structure explanations with clear headings (### Section Title) and concise paragraphs.',
        '- Always use properly tagged fenced code blocks (```python, ```javascript, ```html, etc.).',
        '- If the user writes in Urdu, Roman Urdu / Hinglish, Hindi, or Punjabi, reply in that exact language and script.',
        '- Keep your tone intelligent, direct, articulate, and helpful.'
      ].join(' ');
    } else if (isLiquidNeural) {
      systemPrompt = [
        'You are f0undr Ai running on the Liquid Neural model (powered by liquid/lfm-2.5-2.6b:free), hosted on f0undr Ai created by f0undr and the f0undr Team.',
        'CRITICAL IDENTITY: Never mention OpenAI, LiquidAI, ChatGPT, or third-party AI companies. You are running as Liquid Neural on f0undr Ai.',
        'You operate on a high-speed Liquid Neural dynamic state architecture with 256k context.',
        'You have real-time live internet search capabilities via LangSearch.',
        'When live search results or context are provided, use them as real-time ground truth.',
        'Never claim that you lack real-time data or market information when relevant data is present in the context.',
        'MULTI-TURN MEMORY: You maintain full multi-turn conversational context. When the user asks follow-up questions referencing previous messages (e.g., "what is gemini" followed by "who make it", "how does it work", "who owns it", "is it free"), connect the reference to the prior conversation history and answer with complete clarity.',
        'FORMATTING & PRESENTATION (ChatGPT / Gemini / Claude style):',
        '- Format all responses with clean, beautiful GitHub Flavored Markdown.',
        '- Structure explanations with clear headings (### Section Title) and readable paragraphs.',
        '- Use bullet points (- **Key Point**: explanation) or numbered steps (1. Step) with proper indentation.',
        '- NEVER output loose or unclosed pipe symbols (| item | desc |). If tabular data is needed, use standard markdown table syntax with headers and dividers (| Column 1 | Column 2 |\n|---|---|\n| Data 1 | Data 2 |).',
        '- Place code inside standard fenced code blocks with language identifiers (```html, ```css, ```javascript, ```python, etc.).',
        '- If the user writes in Urdu, Roman Urdu / Hinglish, Hindi, or Punjabi, reply in that exact language and script.',
        '- Keep your tone intelligent, direct, articulate, and helpful.'
      ].join(' ');
    } else {
      systemPrompt = [
        'You are f0undr Ai, powered by model genni 1, created by f0undr and the f0undr Team.',
        'Model genni 2 is active, genni 3 is coming soon, and other models like Liquid Neural and North Mini Code are available under More models.',
        'CRITICAL IDENTITY: Never mention OpenAI, GPT-4, ChatGPT, or third-party AI companies. You are built exclusively as f0undr Ai on the genni 1 model.',
        'You have real-time live internet search capabilities via LangSearch.',
        'When live search results or context are provided, use them as real-time ground truth to answer queries about current market prices, cryptocurrency, stocks, news, events, weather, or real-world facts.',
        'Never claim that you lack real-time data or market information when relevant data is present in the context.',
        'MULTI-TURN MEMORY: You maintain full multi-turn conversational context. When the user asks follow-up questions referencing previous messages (e.g., "what is gemini" followed by "who make it", "how does it work", "who owns it", "is it free"), connect the reference to the prior conversation history and answer with complete clarity.',
        'FORMATTING & PRESENTATION (ChatGPT / Gemini / Claude style):',
        '- Format all responses with clean, beautiful GitHub Flavored Markdown.',
        '- Structure explanations with clear headings (### Section Title) and readable paragraphs.',
        '- Use bullet points (- **Key Point**: explanation) or numbered steps (1. Step) with proper indentation.',
        '- NEVER output loose or unclosed pipe symbols (| item | desc |). If tabular data is needed, use standard markdown table syntax with headers and dividers (| Column 1 | Column 2 |\n|---|---|\n| Data 1 | Data 2 |).',
        '- Place code inside standard fenced code blocks with language identifiers (```html, ```css, ```javascript, ```python, etc.).',
        '- If the user writes in Urdu, Roman Urdu / Hinglish, Hindi, or Punjabi, reply in that exact language and script.',
        '- Keep your tone intelligent, direct, articulate, and helpful.'
      ].join(' ');
    }

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Include recent conversation turns with full multi-turn context (excluding current duplicate if already at end)
    const historyTurns = conversation.filter((m) => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string');
    const previousTurns = historyTurns.length && historyTurns.at(-1).content.trim() === question.trim()
      ? historyTurns.slice(0, -1)
      : historyTurns;

    for (const msg of previousTurns.slice(-8)) {
      messages.push({ role: msg.role, content: msg.content.slice(0, 1500) });
    }

    const userPrompt = context
      ? `Context / Knowledge:\n${context.slice(0, 5000)}\n\nQuestion:\n${question}`
      : question;

    messages.push({ role: 'user', content: userPrompt });

    onStatus({
      text: isGenni3
        ? 'Omni creating & thinking'
        : (isGenni2
            ? 'Deep thinking'
            : (isNorthMiniCode
                ? 'Reasoning (North Mini Code)'
                : (isLiquidNeural ? 'Thinking (Liquid Neural)' : 'Thinking')))
    });

    // Use OpenRouter for Liquid Neural and North Mini Code if key is configured, otherwise fallback to Pollinations
    let fetchUrl = POLLINATIONS_ENDPOINT;
    let fetchHeaders = { 'Content-Type': 'application/json' };
    let fetchBody;

    if (isLiquidNeural && config.openrouterApiKey) {
      fetchUrl = OPENROUTER_ENDPOINT;
      fetchHeaders = {
        'Authorization': `Bearer ${config.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://f0undr-ai.vercel.app/',
        'X-Title': 'f0undr Ai'
      };
      fetchBody = JSON.stringify({
        model: 'liquid/lfm-2.5-2.6b:free',
        messages,
        stream: true
      });
    } else if (isNorthMiniCode && config.openrouterApiKey) {
      fetchUrl = OPENROUTER_ENDPOINT;
      fetchHeaders = {
        'Authorization': `Bearer ${config.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://f0undr-ai.vercel.app/',
        'X-Title': 'f0undr Ai'
      };
      fetchBody = JSON.stringify({
        model: 'cohere/north-mini-code:free',
        messages,
        stream: true
      });
    } else {
      fetchBody = JSON.stringify({
        messages,
        model: 'openai-fast',
        stream: true
      });
    }

    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: fetchHeaders,
      body: fetchBody,
      signal: controller.signal
    });

    if (!res.ok) throw new Error(`AI endpoint HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let answer = '';
    let hasReasoned = false;
    let startedContent = false;

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ') || trimmed === 'data: [DONE]') continue;

        try {
          const payload = JSON.parse(trimmed.slice(6));
          const delta = payload.choices?.[0]?.delta || {};

          if (delta.reasoning) {
            if (!hasReasoned) {
              hasReasoned = true;
              onStatus({ text: isGenni3 ? 'Omni reasoning' : (isGenni2 ? 'Deep thinking' : (isNorthMiniCode ? 'Code reasoning' : 'Reasoning')) });
            }
            if (isGenni2 || isNorthMiniCode || isGenni3) {
              onThought(delta.reasoning);
            }
          }

          if (delta.content) {
            if (!startedContent) {
              startedContent = true;
              onStatus({ text: 'Writing the answer' });
            }
            answer += delta.content;
            onToken(delta.content);
          }
        } catch {
          // Ignore partial or unparseable JSON in chunk
        }
      }
    }

    const trimmedAnswer = answer.trim();
    return trimmedAnswer.length > 0 ? trimmedAnswer : null;
  } catch {
    // If aborted or network failed, return null to fallback cleanly
    return null;
  } finally {
    clearTimeout(timer);
  }
}
