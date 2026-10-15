/**
 * Zero-API-key AI generation via free public inference endpoint.
 *
 * Uses Pollinations text endpoint (GPT-OSS 20B reasoning model).
 * Streams tokens directly into SSE so words appear in real-time.
 * If the endpoint is down or times out, returns null to allow seamless
 * fallback to the local extractive sentence scorer.
 */

const ENDPOINT = 'https://text.pollinations.ai/';

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
    const isGenni2 = model === 'genni 2';
    const systemPrompt = isGenni2
      ? [
          'You are f0undr Ai, powered by model genni 2 (Advanced Deep Reasoning & Code Engine), created by f0undr and the f0undr Team.',
          'Model genni 3 is coming soon.',
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
        ].join(' ')
      : [
          'You are f0undr Ai, powered by model genni 1, created by f0undr and the f0undr Team.',
          'Models genni 2 and genni 3 are coming soon.',
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

    onStatus({ text: isGenni2 ? 'Deep thinking' : 'Thinking' });

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: 'openai-fast',
        stream: true
      }),
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
              onStatus({ text: isGenni2 ? 'Deep thinking' : 'Reasoning' });
            }
            if (isGenni2) {
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
