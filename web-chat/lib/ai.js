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
  onStatus = () => {},
  onToken = () => {},
  timeoutMs = 20000,
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const systemPrompt = [
      'You are f0undr Ai, powered by model genni 1, created by f0undr and the f0undr Team.',
      'Models genni 2 and genni 3 are coming soon.',
      'You have real-time live internet search capabilities via LangSearch.',
      'When live search results or context are provided, use them as real-time ground truth to answer queries about current market prices, cryptocurrency, stocks, news, events, weather, or real-world facts.',
      'Never claim that you lack real-time data or market information when relevant data is present in the context.',
      'Answer clearly, accurately, concisely, and helpfully.',
      'Do not include markdown links, raw URLs, or "according to" citations unless explicitly requested.',
      'If the user writes in Urdu, Roman Urdu / Hinglish, Hindi, or Punjabi, reply in that exact language and script.',
      'Keep your tone direct, natural, and helpful.'
    ].join(' ');

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Include recent conversation turns if available
    for (const msg of conversation.slice(-4)) {
      if (['user', 'assistant'].includes(msg.role) && typeof msg.content === 'string') {
        messages.push({ role: msg.role, content: msg.content.slice(0, 1000) });
      }
    }

    const userPrompt = context
      ? `Context / Knowledge:\n${context.slice(0, 4000)}\n\nQuestion:\n${question}`
      : question;

    messages.push({ role: 'user', content: userPrompt });

    onStatus({ text: 'Thinking' });

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

          if (delta.reasoning && !hasReasoned) {
            hasReasoned = true;
            onStatus({ text: 'Reasoning' });
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
