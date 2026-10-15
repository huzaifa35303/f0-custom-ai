const thread = document.getElementById('thread');
const form = document.getElementById('composer');
const input = document.getElementById('input');
const send = document.getElementById('send');
const statusPill = document.getElementById('status');
const resetBtn = document.getElementById('reset');

const modelPickerContainer = document.getElementById('model-picker-container');
const modelPickerTrigger = document.getElementById('model-picker-trigger');
const pickerTriggerIcon = document.getElementById('picker-trigger-icon');
const pickerTriggerName = document.getElementById('picker-trigger-name');
const pickerTriggerTag = document.getElementById('picker-trigger-tag');
const modelDropdownMenu = document.getElementById('model-dropdown-menu');
const checkGenni1 = document.getElementById('check-genni-1');
const checkGenni11 = document.getElementById('check-genni-1-1');
const checkGenni2 = document.getElementById('check-genni-2');
const modelMenuItems = document.querySelectorAll('[data-model-option]');

const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const filePreview = document.getElementById('file-attachment-preview');
const attachedFileName = document.getElementById('attached-file-name');
const attachedFileSize = document.getElementById('attached-file-size');
const removeFileBtn = document.getElementById('remove-file-btn');

let currentModel = 'genni 1';
let attachedFile = null;

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
  '<span class="badge-active">Models: <strong>genni 1</strong>, <strong>genni 1.1</strong> &amp; <strong>genni 2</strong></span>' +
  '<span class="badge-soon">genni 3 coming soon</span>' +
  '</div>' +
  '<p>Switch models anytime: <strong>genni 1</strong> for fast live answers, <strong>genni 1.1</strong> for Liquid Neural speed, or <strong>genni 2</strong> for Deep Reasoning &amp; live code runner.</p>' +
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

function setModel(model) {
  currentModel = model;
  if (model === 'genni 2') {
    if (pickerTriggerName) pickerTriggerName.textContent = 'genni 2';
    if (pickerTriggerTag) pickerTriggerTag.textContent = 'Deep Think';
    if (pickerTriggerIcon) {
      pickerTriggerIcon.textContent = '⚡';
      pickerTriggerIcon.style.color = '#a78bfa';
    }
    if (checkGenni2) checkGenni2.style.display = 'flex';
    if (checkGenni1) checkGenni1.style.display = 'none';
    if (checkGenni11) checkGenni11.style.display = 'none';
    input.placeholder = 'Ask genni 2 with Deep Reasoning & Code Runner…';
  } else if (model === 'genni 1.1') {
    if (pickerTriggerName) pickerTriggerName.textContent = 'genni 1.1';
    if (pickerTriggerTag) pickerTriggerTag.textContent = 'Liquid';
    if (pickerTriggerIcon) {
      pickerTriggerIcon.textContent = '💧';
      pickerTriggerIcon.style.color = '#06b6d4';
    }
    if (checkGenni11) checkGenni11.style.display = 'flex';
    if (checkGenni1) checkGenni1.style.display = 'none';
    if (checkGenni2) checkGenni2.style.display = 'none';
    input.placeholder = 'Send a message to genni 1.1 (Liquid Neural)…';
  } else {
    if (pickerTriggerName) pickerTriggerName.textContent = 'genni 1';
    if (pickerTriggerTag) pickerTriggerTag.textContent = 'Fast';
    if (pickerTriggerIcon) {
      pickerTriggerIcon.textContent = '✦';
      pickerTriggerIcon.style.color = '';
    }
    if (checkGenni1) checkGenni1.style.display = 'flex';
    if (checkGenni11) checkGenni11.style.display = 'none';
    if (checkGenni2) checkGenni2.style.display = 'none';
    input.placeholder = 'Send a message to genni 1…';
  }

  // Update selected class in dropdown
  modelMenuItems.forEach((item) => {
    if (item.getAttribute('data-model-option') === model) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });

  closeModelDropdown();
}

function toggleModelDropdown() {
  if (!modelDropdownMenu) return;
  const isHidden = modelDropdownMenu.classList.contains('hidden');
  if (isHidden) {
    openModelDropdown();
  } else {
    closeModelDropdown();
  }
}

function openModelDropdown() {
  if (!modelDropdownMenu) return;
  modelDropdownMenu.classList.remove('hidden');
  modelPickerContainer?.classList.add('open');
  modelPickerTrigger?.setAttribute('aria-expanded', 'true');
}

function closeModelDropdown() {
  if (!modelDropdownMenu) return;
  modelDropdownMenu.classList.add('hidden');
  modelPickerContainer?.classList.remove('open');
  modelPickerTrigger?.setAttribute('aria-expanded', 'false');
}

// Model dropdown listeners
modelPickerTrigger?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleModelDropdown();
});

modelMenuItems.forEach((item) => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const model = item.getAttribute('data-model-option');
    if (model) setModel(model);
  });
});

// Close when clicking outside
document.addEventListener('click', (e) => {
  if (modelPickerContainer && !modelPickerContainer.contains(e.target)) {
    closeModelDropdown();
  }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modelDropdownMenu && !modelDropdownMenu.classList.contains('hidden')) {
    closeModelDropdown();
  }
});

attachBtn?.addEventListener('click', () => fileInput?.click());

fileInput?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Auto-switch to genni 2 for document & code analysis
  setModel('genni 2');

  const reader = new FileReader();
  reader.onload = (evt) => {
    attachedFile = {
      name: file.name,
      size: formatFileSize(file.size),
      content: evt.target.result,
    };
    if (attachedFileName) attachedFileName.textContent = file.name;
    if (attachedFileSize) attachedFileSize.textContent = formatFileSize(file.size);
    filePreview?.classList.remove('hidden');
    attachBtn?.classList.add('has-file');
  };
  reader.readAsText(file);
});

removeFileBtn?.addEventListener('click', () => {
  attachedFile = null;
  if (fileInput) fileInput.value = '';
  filePreview?.classList.add('hidden');
  attachBtn?.classList.remove('has-file');
});

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

  const userFile = attachedFile;
  // Reset attachment staging immediately
  attachedFile = null;
  if (fileInput) fileInput.value = '';
  filePreview?.classList.add('hidden');
  attachBtn?.classList.remove('has-file');

  history.push({ role: 'user', content: text });
  const userMsgBubble = addMessage('user');
  if (userFile) {
    const chip = document.createElement('div');
    chip.className = 'file-preview-chip';
    chip.style.marginBottom = '6px';
    chip.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
      <span>${escapeHtml(userFile.name)}</span>
      <span class="attached-file-size">${escapeHtml(userFile.size)}</span>
    `;
    userMsgBubble.appendChild(chip);
  }
  const textContainer = document.createElement('div');
  textContainer.textContent = text;
  userMsgBubble.appendChild(textContainer);

  const body = addMessage('assistant');
  body.classList.add('caret');
  let note = addNote(currentModel === 'genni 2' ? 'Deep Thinking' : (currentModel === 'genni 1.1' ? 'Processing Liquid Neural' : 'Thinking'));
  let answer = '';
  let thoughtBox = null;
  let thoughtContent = null;
  const isGenni2 = currentModel === 'genni 2';

  try {
    await stream({ messages: history, model: currentModel, file: userFile }, (msg) => {
      switch (msg.event) {
        case 'status':
          if (note.isConnected) note.lastChild.textContent = msg.text;
          break;
        case 'thought':
          if (note.isConnected) note.remove();
          if (isGenni2) {
            if (!thoughtBox) {
              thoughtBox = document.createElement('details');
              thoughtBox.className = 'thought-box';
              thoughtBox.open = true;
              thoughtBox.innerHTML = `
                <summary class="thought-summary">
                  <span class="thought-sparkle">⚡</span>
                  <span class="thought-title">Deep Thinking</span>
                  <span class="thought-dot"></span>
                </summary>
                <div class="thought-content"></div>
              `;
              body.appendChild(thoughtBox);
              thoughtContent = thoughtBox.querySelector('.thought-content');
            }
            if (thoughtContent) {
              thoughtContent.textContent += msg.text;
            }
            scroll();
          }
          break;
        case 'token':
          if (note.isConnected) note.remove();
          if (thoughtBox && !thoughtBox.dataset.finalized) {
            thoughtBox.dataset.finalized = 'true';
            const dot = thoughtBox.querySelector('.thought-dot');
            if (dot) dot.remove();
            const title = thoughtBox.querySelector('.thought-title');
            if (title) title.textContent = 'Thought Process (Completed)';
          }
          answer += msg.text;
          renderMessageContent(body, answer);
          scroll();
          break;
        case 'final':
          if (note.isConnected) note.remove();
          answer = msg.text;
          if (thoughtBox && !thoughtBox.dataset.finalized) {
            thoughtBox.dataset.finalized = 'true';
            const dot = thoughtBox.querySelector('.thought-dot');
            if (dot) dot.remove();
            const title = thoughtBox.querySelector('.thought-title');
            if (title) title.textContent = 'Thought Process (Completed)';
          }
          renderMessageContent(body, answer);
          scroll();
          break;
        case 'error':
          if (note.isConnected) note.remove();
          note = addNote(msg.text, true);
          break;
      }
    });
  } catch (err) {
    addNote(err.message, true);
  }

  if (note && !note.classList.contains('error')) note.remove();
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

function renderMessageContent(body, md) {
  let answerContainer = body.querySelector('.answer-prose');
  if (!answerContainer) {
    answerContainer = document.createElement('div');
    answerContainer.className = 'answer-prose';
    body.appendChild(answerContainer);
  }
  answerContainer.innerHTML = render(md);
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

/** Comprehensive ChatGPT / Gemini / Claude style Markdown renderer with tables, lists, quotes, headings, and code preview. */
function render(md) {
  if (!md) return '';
  const esc = escapeHtml;
  const blocks = [];

  // 1. Extract code blocks ```lang ... ```
  let text = md.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, rawCode) => {
    const code = rawCode.trim();
    const l = (lang || 'code').toLowerCase();
    const isHtmlOrSvg = ['html', 'svg', 'xml'].includes(l);
    const codeId = 'code_' + Math.random().toString(36).slice(2, 9);

    const header = `
      <div class="code-header">
        <span>${esc(l.toUpperCase())}</span>
        <div class="code-actions">
          ${isHtmlOrSvg ? `<button type="button" class="code-btn preview-btn" data-target="${codeId}">▶ Live Preview</button>` : ''}
          <button type="button" class="code-btn copy-btn" data-target="${codeId}">Copy</button>
        </div>
      </div>
    `;
    const pre = `<pre><code id="${codeId}" data-lang="${esc(l)}">${esc(code)}</code></pre>`;
    blocks.push(`<div class="code-block-wrap">${header}${pre}</div>`);
    return `\u0000${blocks.length - 1}\u0000`;
  });

  // 2. Escape HTML entities
  text = esc(text);

  // 3. Inline elements parser: bold, italic, code, links, del
  const parseInline = (s) => {
    return s
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(/_([^_\n]+)_/g, '<em>$1</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  };

  const parseRow = (line) => {
    let cells = line.split('|').map((c) => c.trim());
    if (cells[0] === '') cells.shift();
    if (cells.length && cells[cells.length - 1] === '') cells.pop();
    return cells;
  };

  // 4. Line by line block parsing (headings, blockquotes, tables, horizontal rules, lists, paragraphs)
  const sections = text.split(/\n{2,}/);
  const outSections = [];

  for (const sec of sections) {
    const trimmedSec = sec.trim();
    if (!trimmedSec) continue;

    if (/^\u0000\d+\u0000$/.test(trimmedSec)) {
      outSections.push(trimmedSec);
      continue;
    }

    const lines = sec.split('\n');
    let currentList = null; // 'ul' or 'ol'
    let currentListItems = [];
    let tableBuffer = [];
    const elements = [];

    const flushList = () => {
      if (currentList && currentListItems.length) {
        elements.push(`<${currentList}>${currentListItems.map((it) => `<li>${parseInline(it)}</li>`).join('')}</${currentList}>`);
        currentList = null;
        currentListItems = [];
      }
    };

    let pBuffer = [];
    const flushP = () => {
      if (pBuffer.length) {
        elements.push(`<p>${parseInline(pBuffer.join('<br>'))}</p>`);
        pBuffer = [];
      }
    };

    const flushTable = () => {
      if (!tableBuffer.length) return;
      const rawLines = tableBuffer;
      tableBuffer = [];
      let hasHeader = false;
      if (rawLines.length >= 2 && /^\s*\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)+\|?\s*$/.test(rawLines[1])) {
        hasHeader = true;
      }

      let tableHtml = '<div class="table-wrap"><table>';
      if (hasHeader) {
        const headerCells = parseRow(rawLines[0]);
        tableHtml += '<thead><tr>' + headerCells.map((c) => `<th>${parseInline(c)}</th>`).join('') + '</tr></thead>';
        tableHtml += '<tbody>';
        for (let i = 2; i < rawLines.length; i++) {
          const cells = parseRow(rawLines[i]);
          tableHtml += '<tr>' + cells.map((c) => `<td>${parseInline(c)}</td>`).join('') + '</tr>';
        }
        tableHtml += '</tbody>';
      } else {
        tableHtml += '<tbody>';
        for (let i = 0; i < rawLines.length; i++) {
          const cells = parseRow(rawLines[i]);
          if (cells.length >= 2) {
            tableHtml += '<tr><td class="table-key"><code>' + parseInline(cells[0]) + '</code></td><td>' + parseInline(cells.slice(1).join(' - ')) + '</td></tr>';
          } else if (cells.length === 1) {
            tableHtml += '<tr><td colspan="2">' + parseInline(cells[0]) + '</td></tr>';
          }
        }
        tableHtml += '</tbody>';
      }
      tableHtml += '</table></div>';
      elements.push(tableHtml);
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (/^\u0000\d+\u0000$/.test(line)) {
        flushP();
        flushList();
        flushTable();
        elements.push(line);
        continue;
      }

      // Table row (lines starting with '|')
      if (line.startsWith('|')) {
        flushP();
        flushList();
        tableBuffer.push(line);
        continue;
      } else if (tableBuffer.length) {
        flushTable();
      }

      // Headings
      const hMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (hMatch) {
        flushP();
        flushList();
        const level = hMatch[1].length;
        elements.push(`<h${level}>${parseInline(hMatch[2])}</h${level}>`);
        continue;
      }

      // Horizontal rule
      if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line)) {
        flushP();
        flushList();
        elements.push('<hr>');
        continue;
      }

      // Blockquote
      if (line.startsWith('&gt;') || line.startsWith('>')) {
        flushP();
        flushList();
        const quoteText = line.replace(/^(&gt;|>)\s?/, '');
        elements.push(`<blockquote>${parseInline(quoteText)}</blockquote>`);
        continue;
      }

      // Unordered list item (- item, * item, + item)
      const ulMatch = line.match(/^[-*+]\s+(.+)$/);
      if (ulMatch) {
        flushP();
        if (currentList !== 'ul') {
          flushList();
          currentList = 'ul';
        }
        currentListItems.push(ulMatch[1]);
        continue;
      }

      // Ordered list item (1. item)
      const olMatch = line.match(/^\d+[.)]\s+(.+)$/);
      if (olMatch) {
        flushP();
        if (currentList !== 'ol') {
          flushList();
          currentList = 'ol';
        }
        currentListItems.push(olMatch[1]);
        continue;
      }

      // Normal text line
      flushList();
      pBuffer.push(line);
    }

    flushP();
    flushList();
    flushTable();
    outSections.push(elements.join('\n'));
  }

  // Restore placeholders
  return outSections.join('\n').replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[Number(i)]);
}

// Global delegated click for code block actions (Copy & Live Preview)
document.addEventListener('click', (e) => {
  const copyBtn = e.target.closest('.copy-btn');
  if (copyBtn) {
    const targetId = copyBtn.dataset.target;
    const codeEl = document.getElementById(targetId);
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.textContent).then(() => {
        const orig = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = orig;
        }, 1500);
      });
    }
    return;
  }

  const previewBtn = e.target.closest('.preview-btn');
  if (previewBtn) {
    const targetId = previewBtn.dataset.target;
    const codeEl = document.getElementById(targetId);
    const wrap = previewBtn.closest('.code-block-wrap');
    if (!codeEl || !wrap) return;

    let previewContainer = wrap.querySelector('.live-preview-container');
    if (previewContainer) {
      previewContainer.remove();
      previewBtn.textContent = '▶ Live Preview';
    } else {
      previewContainer = document.createElement('div');
      previewContainer.className = 'live-preview-container';
      const iframe = document.createElement('iframe');
      iframe.className = 'live-preview-frame';
      iframe.setAttribute('sandbox', 'allow-scripts');
      iframe.srcdoc = codeEl.textContent;
      previewContainer.appendChild(iframe);
      wrap.appendChild(previewContainer);
      previewBtn.textContent = '✕ Close Preview';
      scroll();
    }
  }
});
