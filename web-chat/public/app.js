const thread = document.getElementById('thread');
const form = document.getElementById('composer');
const input = document.getElementById('input');
const send = document.getElementById('send');
const statusPill = document.getElementById('status');
const resetBtn = document.getElementById('reset');

const WELCOME =
  '<div class="welcome"><h2>Ask f0undr Ai anything</h2><p>Every answer is looked up on the web as ' +
  'you ask, then written out in plain language.</p></div>';

/** @type {{role: 'user'|'assistant', content: string}[]} */
let history = [];
let busy = false;

checkHealth();

// Installable, and opens offline. Localhost and HTTPS only, which is every
// place this actually runs.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* no offline support, everything else still works */
    });
  });
}

resetBtn.addEventListener('click', () => {
  history = [];
  thread.innerHTML = WELCOME;
  input.focus();
});

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 180) + 'px';
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;
  input.value = '';
  input.style.height = 'auto';
  ask(text);
});

async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const h = await res.json();
    const label = { full: 'web search ready', limited: 'Wikipedia only', down: h.error };
    const tone = { full: 'good', limited: 'warn', down: 'bad' };
    statusPill.textContent = label[h.mode] ?? (h.ok ? 'ready' : h.error);
    statusPill.className = 'status ' + (tone[h.mode] ?? (h.ok ? 'good' : 'bad'));
    if (h.error) statusPill.title = h.error;
  } catch {
    statusPill.textContent = 'server unreachable';
    statusPill.className = 'status bad';
  }
}

async function ask(text) {
  busy = true;
  send.disabled = true;
  document.querySelector('.welcome')?.remove();

  history.push({ role: 'user', content: text });
  addMessage('user').textContent = text;

  const body = addMessage('assistant');
  body.classList.add('caret');
  let note = addNote('Thinking');
  let answer = '';

  try {
    await stream({ messages: history }, (msg) => {
      switch (msg.event) {
        case 'status':
          if (note.isConnected) note.lastChild.textContent = msg.text;
          break;
        case 'token':
          note.remove();
          answer += msg.text;
          body.innerHTML = render(answer);
          scroll();
          break;
        case 'final':
          answer = msg.text;
          body.innerHTML = render(answer);
          scroll();
          break;
        case 'error':
          note.remove();
          note = addNote(msg.text, true);
          break;
      }
    });
  } catch (err) {
    addNote(err.message, true);
  }

  if (!note.classList.contains('error')) note.remove();
  body.classList.remove('caret');
  if (answer) history.push({ role: 'assistant', content: answer });
  else body.closest('.msg').remove();

  busy = false;
  send.disabled = false;
  input.focus();
  scroll();
}

async function stream(payload, onEvent) {
  let res;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // "Failed to fetch" means the page is open but nothing is listening —
    // almost always the server having been stopped since the tab was loaded.
    checkHealth();
    throw new Error('Can’t reach the server. Start it again with "npm start", then resend.');
  }
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';
    for (const chunk of chunks) {
      const line = chunk.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      const msg = JSON.parse(line.slice(6));
      if (msg.event === 'done') return;
      onEvent(msg);
    }
  }
}

function addMessage(role) {
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}`;

  if (role === 'assistant') {
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'f0';
    wrap.append(avatar);
  }

  const body = document.createElement('div');
  body.className = 'body';
  // Urdu has to lay out right to left; dir="auto" works that out per message.
  body.setAttribute('dir', 'auto');
  wrap.append(body);
  thread.append(wrap);
  scroll();
  return body;
}

function addNote(text, isError = false) {
  const note = document.createElement('div');
  note.className = 'note' + (isError ? ' error' : '');
  if (!isError) note.append(Object.assign(document.createElement('span'), { className: 'dot' }));
  note.append(document.createTextNode(text));
  thread.append(note);
  scroll();
  return note;
}

function scroll() {
  thread.scrollTop = thread.scrollHeight;
}

/** Just enough markdown for chat: escape everything, then add the few tags back. */
function render(md) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const blocks = [];
  let out = md.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    blocks.push(`<pre><code data-lang="${esc(lang)}">${esc(code.trim())}</code></pre>`);
    return `\u0000${blocks.length - 1}\u0000`;
  });

  out = esc(out)
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^#{1,6}\s+(.+)$/gm, '<h3>$1</h3>');

  out = out
    .split(/\n{2,}/)
    .map((para) => {
      const lines = para.split('\n');
      if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${l.replace(/^\s*[-*]\s+/, '')}</li>`).join('')}</ul>`;
      }
      if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
        return `<ol>${lines.map((l) => `<li>${l.replace(/^\s*\d+[.)]\s+/, '')}</li>`).join('')}</ol>`;
      }
      if (/^<(h3|pre|ul|ol)/.test(para.trim()) || para.includes('\u0000')) return para;
      return `<p>${lines.join('<br>')}</p>`;
    })
    .join('\n');

  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[Number(i)]);
}
