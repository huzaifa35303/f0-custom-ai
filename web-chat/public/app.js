const thread = document.getElementById('thread');
const form = document.getElementById('composer');
const input = document.getElementById('input');
const send = document.getElementById('send');
const statusPill = document.getElementById('status');
const resetBtn = document.getElementById('reset');

const sidebar = document.getElementById('sidebar');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
const sidebarNewBtn = document.getElementById('sidebar-new-btn');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');
const chatList = document.getElementById('chat-list');
const contextMenu = document.getElementById('context-menu');
const ctxPinLabel = document.getElementById('ctx-pin-label');
const ctxUnreadLabel = document.getElementById('ctx-unread-label');

const WELCOME =
  '<div class="welcome">' +
  '<h2>Ask f0undr Ai anything</h2>' +
  '<div class="welcome-model-pill">' +
  '<span class="badge-active">Model: <strong>genni 1</strong></span>' +
  '<span class="badge-soon">genni 2 &amp; genni 3 coming soon</span>' +
  '</div>' +
  '<p>Every answer is powered by genni 1 with live search and taught memory, written out in plain language.</p>' +
  '</div>';

const STORAGE_KEY = 'foundr_ai_chats_v2';

/** @type {{id: string, title: string, messages: {role: 'user'|'assistant', content: string}[], pinned?: boolean, unread?: boolean, project?: string, group?: string, createdAt: number, updatedAt: number}[]} */
let chats = loadChats();
let activeChatId = null;
let contextChatId = null;
let history = [];
let busy = false;

// Initialize app
initSidebar();
checkHealth();

// Service Worker for offline PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

function loadChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChats() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {}
}

function initSidebar() {
  renderChatList();

  // If there are previous chats, select the most recent one
  if (chats.length > 0) {
    selectChat(chats[0].id);
  } else {
    startNewChat();
  }

  sidebarToggleBtn?.addEventListener('click', toggleSidebar);
  sidebarCloseBtn?.addEventListener('click', closeSidebar);
  sidebarBackdrop?.addEventListener('click', closeSidebar);
  sidebarNewBtn?.addEventListener('click', startNewChat);
  resetBtn?.addEventListener('click', startNewChat);

  // Close context menu on outside click
  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
      closeContextMenu();
    }
  });

  // Context menu item actions
  contextMenu?.querySelectorAll('.ctx-item').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      handleMenuAction(action);
    });
  });

  // Keyboard shortcuts when context menu is active
  window.addEventListener('keydown', (e) => {
    if (!contextMenu.classList.contains('hidden') && contextChatId) {
      const key = e.key.toUpperCase();
      if (key === 'P') {
        e.preventDefault();
        handleMenuAction('pin');
      } else if (key === 'U') {
        e.preventDefault();
        handleMenuAction('unread');
      } else if (key === 'R') {
        e.preventDefault();
        handleMenuAction('rename');
      } else if (key === 'D') {
        e.preventDefault();
        handleMenuAction('delete');
      } else if (e.key === 'Escape') {
        closeContextMenu();
      }
    }
  });
}

function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
  sidebarBackdrop.classList.toggle('active', !sidebar.classList.contains('collapsed') && window.innerWidth <= 768);
}

function closeSidebar() {
  sidebar.classList.add('collapsed');
  sidebarBackdrop.classList.remove('active');
}

function startNewChat() {
  activeChatId = null;
  history = [];
  thread.innerHTML = WELCOME;
  renderChatList();
  input.focus();
  if (window.innerWidth <= 768) closeSidebar();
}

function selectChat(id) {
  const chat = chats.find((c) => c.id === id);
  if (!chat) return;

  activeChatId = chat.id;
  chat.unread = false;
  saveChats();

  history = [...chat.messages];
  thread.innerHTML = '';

  if (!history.length) {
    thread.innerHTML = WELCOME;
  } else {
    for (const msg of history) {
      const body = addMessage(msg.role);
      body.innerHTML = msg.role === 'assistant' ? render(msg.content) : escapeHtml(msg.content);
    }
  }

  renderChatList();
  scroll();
  input.focus();
  if (window.innerWidth <= 768) closeSidebar();
}

function formatDateGroup(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (targetDay === today) return 'Today';
  if (targetDay === yesterday) return 'Yesterday';

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderChatList() {
  if (!chatList) return;
  chatList.innerHTML = '';

  if (!chats.length) {
    chatList.innerHTML =
      '<div style="padding: 14px 10px; color: var(--muted); font-size: 12.5px;">No conversations yet.</div>';
    return;
  }

  const pinned = chats.filter((c) => c.pinned);
  const normal = chats.filter((c) => !c.pinned);

  pinned.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  normal.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

  if (pinned.length) {
    renderGroup('Pinned', pinned);
  }

  const groups = new Map();
  for (const c of normal) {
    const groupName = formatDateGroup(c.createdAt || Date.now());
    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName).push(c);
  }

  for (const [groupName, items] of groups.entries()) {
    renderGroup(groupName, items);
  }
}

function renderGroup(title, items) {
  const groupDiv = document.createElement('div');
  groupDiv.className = 'chat-group';

  const titleDiv = document.createElement('div');
  titleDiv.className = 'chat-group-title';
  titleDiv.textContent = title;
  groupDiv.appendChild(titleDiv);

  items.forEach((chat) => {
    const item = document.createElement('div');
    item.className =
      'chat-item' +
      (chat.id === activeChatId ? ' active' : '') +
      (chat.unread ? ' unread' : '');
    item.dataset.id = chat.id;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'chat-item-title';
    titleSpan.textContent = chat.title;
    item.appendChild(titleSpan);

    const menuBtn = document.createElement('button');
    menuBtn.className = 'chat-item-menu-btn';
    menuBtn.type = 'button';
    menuBtn.setAttribute('aria-label', 'Chat options');
    menuBtn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="12" cy="19" r="2.2"/></svg>';

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openContextMenu(chat.id, menuBtn);
    });

    item.addEventListener('click', () => {
      selectChat(chat.id);
    });

    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openContextMenu(chat.id, null, e.clientX, e.clientY);
    });

    groupDiv.appendChild(item);
  });

  chatList.appendChild(groupDiv);
}

function openContextMenu(chatId, triggerElement = null, clientX = 0, clientY = 0) {
  contextChatId = chatId;
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) return;

  ctxPinLabel.textContent = chat.pinned ? 'Unpin' : 'Pin';
  ctxUnreadLabel.textContent = chat.unread ? 'Mark as read' : 'Mark as unread';

  contextMenu.classList.remove('hidden');

  let x = clientX;
  let y = clientY;

  if (triggerElement) {
    const rect = triggerElement.getBoundingClientRect();
    x = rect.left - 120;
    y = rect.bottom + 6;
  }

  const menuWidth = 230;
  const menuHeight = 260;
  if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 12;
  if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 12;
  if (x < 12) x = 12;
  if (y < 12) y = 12;

  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
}

function closeContextMenu() {
  contextMenu.classList.add('hidden');
  contextChatId = null;
}

function handleMenuAction(action) {
  if (!contextChatId) return;
  const chat = chats.find((c) => c.id === contextChatId);
  if (!chat) return;

  switch (action) {
    case 'pin':
      chat.pinned = !chat.pinned;
      saveChats();
      renderChatList();
      closeContextMenu();
      break;

    case 'unread':
      chat.unread = !chat.unread;
      saveChats();
      renderChatList();
      closeContextMenu();
      break;

    case 'rename':
      closeContextMenu();
      setTimeout(() => {
        const title = prompt('Rename conversation:', chat.title);
        if (title && title.trim()) {
          chat.title = title.trim();
          saveChats();
          renderChatList();
        }
      }, 50);
      break;

    case 'project':
      closeContextMenu();
      setTimeout(() => {
        const proj = prompt('Add to project:', chat.project || '');
        if (proj !== null) {
          chat.project = proj.trim();
          if (chat.project && !chat.title.startsWith(`[${chat.project}]`)) {
            chat.title = `[${chat.project}] ${chat.title.replace(/^\[.*?\]\s*/, '')}`;
          }
          saveChats();
          renderChatList();
        }
      }, 50);
      break;

    case 'group':
      closeContextMenu();
      setTimeout(() => {
        const grp = prompt('Move to group:', chat.group || '');
        if (grp !== null) {
          chat.group = grp.trim();
          saveChats();
          renderChatList();
        }
      }, 50);
      break;

    case 'delete':
      closeContextMenu();
      setTimeout(() => {
        if (confirm(`Delete "${chat.title}"?`)) {
          chats = chats.filter((c) => c.id !== chat.id);
          saveChats();
          if (activeChatId === chat.id) {
            startNewChat();
          } else {
            renderChatList();
          }
        }
      }, 50);
      break;
  }
}

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
  if (!statusPill) return;
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

  // If we don't have an active conversation, create one now
  if (!activeChatId) {
    const newChat = {
      id: 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: text.length > 28 ? text.slice(0, 28) + '…' : text,
      messages: [],
      pinned: false,
      unread: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    chats.unshift(newChat);
    activeChatId = newChat.id;
    renderChatList();
  }

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

  if (answer) {
    history.push({ role: 'assistant', content: answer });
    const currentChat = chats.find((c) => c.id === activeChatId);
    if (currentChat) {
      currentChat.messages = [...history];
      currentChat.updatedAt = Date.now();
      saveChats();
      renderChatList();
    }
  } else {
    body.closest('.msg')?.remove();
  }

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

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Just enough markdown for chat: escape everything, then add the few tags back. */
function render(md) {
  const esc = escapeHtml;

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
