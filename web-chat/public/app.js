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
const checkGenni2 = document.getElementById('check-genni-2');
const checkGenni3 = document.getElementById('check-genni-3');
const checkAuto = document.getElementById('check-auto');
const checkLiquidNeural = document.getElementById('check-liquid-neural');
const checkNorthMiniCode = document.getElementById('check-north-mini-code');
const moreModelsContainer = document.getElementById('more-models-container');
const moreModelsTrigger = document.getElementById('more-models-trigger');
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

// User Profile & Account elements (Image 1 style)
const sidebarUserPill = document.getElementById('sidebar-user-pill');
const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
const sidebarUserName = document.getElementById('sidebar-user-name');
const sidebarUserSub = document.getElementById('sidebar-user-sub');
const userPopover = document.getElementById('user-popover');
const popoverUserCard = document.getElementById('popover-user-card');
const popoverAvatar = document.getElementById('popover-avatar');
const popoverName = document.getElementById('popover-name');
const popoverPlan = document.getElementById('popover-plan');
const popoverPlusBtn = document.getElementById('popover-plus-btn');
const popoverPersonalizationBtn = document.getElementById('popover-personalization-btn');
const popoverProfileBtn = document.getElementById('popover-profile-btn');
const popoverSettingsBtn = document.getElementById('popover-settings-btn');
const popoverHelpBtn = document.getElementById('popover-help-btn');
const popoverAuthBtn = document.getElementById('popover-auth-btn');
const popoverAuthLabel = document.getElementById('popover-auth-label');
const claimOfferBtn = document.getElementById('claim-offer-btn');

// Top Navigation Tabs (Image 2 style)
const tabChat = document.getElementById('tab-chat');
const tabWork = document.getElementById('tab-work');

// Composer Tools ("+" button & popover - Image 2 style)
const toolsPickerContainer = document.getElementById('tools-picker-container');
const toolsMenuBtn = document.getElementById('tools-menu-btn');
const toolsPopover = document.getElementById('tools-popover');
const toolUploadBtn = document.getElementById('tool-upload-btn');
const toolImageBtn = document.getElementById('tool-image-btn');
const toolSearchBtn = document.getElementById('tool-search-btn');
const toolResearchBtn = document.getElementById('tool-research-btn');
const toolThinkingBtn = document.getElementById('tool-thinking-btn');
const toolAppdeployBtn = document.getElementById('tool-appdeploy-btn');

// Modals
const authModal = document.getElementById('auth-modal');
const authModalBackdrop = document.getElementById('auth-modal-backdrop');
const authModalClose = document.getElementById('auth-modal-close');
const authTabLogin = document.getElementById('auth-tab-login');
const authTabSignup = document.getElementById('auth-tab-signup');
const authField = document.getElementById('auth-field-name');
const authInputName = document.getElementById('auth-input-name');
const authInputEmail = document.getElementById('auth-input-email');
const authInputPass = document.getElementById('auth-input-pass');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authForm = document.getElementById('auth-form');
const quickLoginHuzaifa = document.getElementById('quick-login-huzaifa');
const guestContinueBtn = document.getElementById('guest-continue-btn');

const personalizationModal = document.getElementById('personalization-modal');
const personalizationBackdrop = document.getElementById('personalization-backdrop');
const personalizationClose = document.getElementById('personalization-close');
const personalizationForm = document.getElementById('personalization-form');
const customUserBio = document.getElementById('custom-user-bio');
const customResponseStyle = document.getElementById('custom-response-style');

const settingsModal = document.getElementById('settings-modal');
const settingsBackdrop = document.getElementById('settings-backdrop');
const settingsClose = document.getElementById('settings-close');
const settingsUserDesc = document.getElementById('settings-user-desc');
const settingsAuthSwitchBtn = document.getElementById('settings-auth-switch-btn');
const settingsClearChatsBtn = document.getElementById('settings-clear-chats-btn');

const upgradeModal = document.getElementById('upgrade-modal');
const upgradeBackdrop = document.getElementById('upgrade-backdrop');
const upgradeClose = document.getElementById('upgrade-close');
const upgradeClaimBtn = document.getElementById('upgrade-claim-btn');

const USER_STORAGE_KEY = 'foundr_ai_user_v2';
const PERSONALIZATION_STORAGE_KEY = 'foundr_ai_personalization_v2';

let currentUser = loadUser();
let userPersonalization = loadPersonalization();

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    name: 'Huzaifa',
    initials: 'HU',
    plan: 'Free',
    email: 'huzaifa@foundr.ai',
    isGuest: false
  };
}

function saveUser() {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
  } catch {}
  updateUserUI();
}

function loadPersonalization() {
  try {
    const raw = localStorage.getItem(PERSONALIZATION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { bio: '', style: '' };
}

function savePersonalization(bio, style) {
  userPersonalization = { bio, style };
  try {
    localStorage.setItem(PERSONALIZATION_STORAGE_KEY, JSON.stringify(userPersonalization));
  } catch {}
}

function updateUserUI() {
  const isGuest = currentUser.isGuest;
  const displayName = isGuest ? 'Guest Account' : currentUser.name;
  const initials = isGuest ? 'G' : (currentUser.initials || (currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'HU'));
  const displayPlan = isGuest ? 'Guest' : (currentUser.plan || 'Free');

  if (sidebarUserAvatar) sidebarUserAvatar.textContent = initials;
  if (sidebarUserName) sidebarUserName.textContent = displayName;
  if (sidebarUserSub) sidebarUserSub.textContent = displayPlan;

  if (popoverAvatar) popoverAvatar.textContent = initials;
  if (popoverName) popoverName.textContent = displayName;
  if (popoverPlan) popoverPlan.textContent = displayPlan;

  if (popoverAuthLabel) popoverAuthLabel.textContent = isGuest ? 'Log in / Sign up' : 'Log out';
  if (settingsUserDesc) settingsUserDesc.textContent = isGuest ? 'Browsing on Guest Account' : `Logged in as ${currentUser.name} (${currentUser.email || 'Free Account'})`;

  const welcomeTitle = document.getElementById('welcome-title');
  if (welcomeTitle) {
    welcomeTitle.textContent = isGuest ? 'Hey, Guest. Ready to dive in?' : `Hey, ${currentUser.name}. Ready to dive in?`;
  }
}

function getWelcomeHTML() {
  const isGuest = currentUser.isGuest;
  const name = isGuest ? 'Guest' : (currentUser.name || 'Huzaifa');
  return (
    '<div class="welcome" id="welcome-container">' +
    '<h2 id="welcome-title">Hey, ' + escapeHtml(name) + '. Ready to dive in?</h2>' +
    '<div class="welcome-model-pill">' +
    '<span class="badge-active">Official Models: <strong>genni 1</strong>, <strong>genni 2</strong> &amp; <strong>genni 3</strong></span>' +
    '</div>' +
    '<p id="welcome-subtext">Official models: <strong>genni 1</strong> for fast search, <strong>genni 2</strong> for Deep Reasoning, and <strong>genni 3</strong> for Omni Studio &amp; live image generation. Explore more models under More models.</p>' +
    '</div>'
  );
}

const STORAGE_KEY = 'foundr_ai_chats_v2';

/** @type {{id: string, title: string, messages: {role: 'user'|'assistant', content: string}[], pinned?: boolean, unread?: boolean, project?: string, group?: string, createdAt: number, updatedAt: number}[]} */
let chats = loadChats();
let activeChatId = null;
let contextChatId = null;
let history = [];
let busy = false;

// ---------------------------------------------------------------- AI Personas (Feature F)
const PERSONA_STORAGE_KEY = 'foundr_ai_persona_v2';
const personaPickerContainer = document.getElementById('persona-picker-container');
const personaPickerTrigger = document.getElementById('persona-picker-trigger');
const personaTriggerIcon = document.getElementById('persona-trigger-icon');
const personaTriggerName = document.getElementById('persona-trigger-name');
const personaDropdownMenu = document.getElementById('persona-dropdown-menu');
const personaItems = document.querySelectorAll('.persona-item');

const PERSONA_CONFIG = {
  general: { name: 'General', icon: '✦' },
  architect: { name: 'Senior Architect', icon: '💻' },
  creative: { name: 'Creative Director', icon: '🎨' },
  researcher: { name: 'Deep Researcher', icon: '📚' },
  bughunter: { name: 'Bug Hunter', icon: '🔍' },
  urdu: { name: 'Urdu / Bilingual', icon: '✍️' }
};

let currentPersona = loadPersona();

function loadPersona() {
  try {
    const saved = localStorage.getItem(PERSONA_STORAGE_KEY);
    if (saved && PERSONA_CONFIG[saved]) return saved;
  } catch {}
  return 'general';
}

function setPersona(personaKey) {
  if (!PERSONA_CONFIG[personaKey]) personaKey = 'general';
  currentPersona = personaKey;
  try {
    localStorage.setItem(PERSONA_STORAGE_KEY, personaKey);
  } catch {}

  const meta = PERSONA_CONFIG[personaKey];
  if (personaTriggerName) personaTriggerName.textContent = meta.name;
  if (personaTriggerIcon) personaTriggerIcon.textContent = meta.icon;

  personaItems.forEach((btn) => {
    btn.classList.toggle('selected', btn.getAttribute('data-persona') === personaKey);
  });

  closePersonaDropdown();
}

function openPersonaDropdown() {
  closeModelDropdown();
  toolsPopover?.classList.add('hidden');
  personaDropdownMenu?.classList.remove('hidden');
  personaPickerContainer?.classList.add('open');
  personaPickerTrigger?.setAttribute('aria-expanded', 'true');
}

function closePersonaDropdown() {
  personaDropdownMenu?.classList.add('hidden');
  personaPickerContainer?.classList.remove('open');
  personaPickerTrigger?.setAttribute('aria-expanded', 'false');
}

function togglePersonaDropdown() {
  if (personaDropdownMenu?.classList.contains('hidden')) {
    openPersonaDropdown();
  } else {
    closePersonaDropdown();
  }
}

function initPersonaSystem() {
  setPersona(currentPersona);

  personaPickerTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePersonaDropdown();
  });

  personaItems.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = btn.getAttribute('data-persona');
      if (p) setPersona(p);
    });
  });

  document.addEventListener('click', (e) => {
    if (personaPickerContainer && !personaPickerContainer.contains(e.target)) {
      closePersonaDropdown();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && personaDropdownMenu && !personaDropdownMenu.classList.contains('hidden')) {
      closePersonaDropdown();
    }
  });
}

// ---------------------------------------------------------------- Persistent Long-Term Memory (Feature D)
const MEMORY_STORAGE_KEY = 'foundr_ai_memories_v2';
const settingsClearMemoriesBtn = document.getElementById('settings-clear-memories-btn');
const memoryAddInput = document.getElementById('memory-add-input');
const memoryAddBtn = document.getElementById('memory-add-btn');
const settingsMemoryList = document.getElementById('settings-memory-list');

let memories = loadMemories();

function loadMemories() {
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [
    'User prefers clean, elegant, modular code architecture and interactive Canvas apps.',
    'User communicates in English and Urdu / Roman Urdu.',
    'User prefers direct, intelligent, high-density explanations without fluff.'
  ];
}

function saveMemories(newMemories) {
  memories = Array.isArray(newMemories) ? newMemories : [];
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
  } catch {}
  renderMemorySettingsList();
}

function addMemory(text) {
  const cleanText = (text || '').trim();
  if (!cleanText) return;
  if (!memories.some((m) => m.toLowerCase() === cleanText.toLowerCase())) {
    memories.unshift(cleanText);
    saveMemories(memories);
  }
}

function deleteMemory(index) {
  if (index >= 0 && index < memories.length) {
    memories.splice(index, 1);
    saveMemories(memories);
  }
}

function renderMemorySettingsList() {
  const settingsMemoryBadge = document.getElementById('settings-memory-badge');
  if (settingsMemoryBadge) {
    settingsMemoryBadge.textContent = String(memories.length);
  }
  if (!settingsMemoryList) return;
  if (!memories.length) {
    settingsMemoryList.innerHTML = '<div class="memory-empty-state" style="padding:16px;text-align:center;color:var(--muted);font-size:12px;">No long-term memories stored yet. Add memories above or tell f0undr Ai to "remember that..." in chat.</div>';
    return;
  }

  settingsMemoryList.innerHTML = memories.map((m, idx) => `
    <div class="memory-item">
      <span class="memory-item-text">${escapeHtml(m)}</span>
      <button type="button" class="memory-item-delete" data-memory-index="${idx}" title="Delete memory">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  `).join('');
}

function detectAndSaveMemories(userText) {
  if (!userText || typeof userText !== 'string') return null;
  const match = userText.match(/^(?:remember\s+(?:that\s+|to\s+|:\s*)?|please\s+remember\s+(?:that\s+|to\s+|:\s*)?|keep\s+in\s+mind\s+(?:that\s+|:\s*)?|note\s+(?:that\s+|:\s*)?|yaad\s+rakhna\s+(?:k[ei]\s+)?|my\s+name\s+is\s+|i\s+prefer\s+|i\s+always\s+(?:use|code|work|want|like|prefer)\s+|i\s+work\s+as\s+(?:an?\s+)?|i\s+am\s+(?:an?\s+)?(?:developer|engineer|coder|designer|student|writer|creator)\b)(.+)/i);
  if (match && match[1]) {
    const memoryFact = userText.trim().replace(/^(?:please\s+)?(?:remember|yaad\s+rakhna)\s+(?:that|to|k[ei])?\s*:?\s*/i, '').trim();
    if (memoryFact.length >= 4 && memoryFact.length <= 300) {
      addMemory(memoryFact);
      showMemoryUpdatedPill(memoryFact);
      return memoryFact;
    }
  }
  return null;
}

function showMemoryUpdatedPill(fact) {
  const pill = document.createElement('div');
  pill.className = 'memory-updated-pill';
  pill.innerHTML = `
    <span class="memory-pill-icon">🧠</span>
    <span class="memory-pill-text">Memory updated: <em>${escapeHtml(fact.slice(0, 48))}${fact.length > 48 ? '…' : ''}</em></span>
  `;
  thread.appendChild(pill);
  scroll();
}

function initMemorySystem() {
  renderMemorySettingsList();

  memoryAddBtn?.addEventListener('click', () => {
    if (memoryAddInput && memoryAddInput.value.trim()) {
      addMemory(memoryAddInput.value.trim());
      memoryAddInput.value = '';
    }
  });

  memoryAddInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (memoryAddInput.value.trim()) {
        addMemory(memoryAddInput.value.trim());
        memoryAddInput.value = '';
      }
    }
  });

  settingsClearMemoriesBtn?.addEventListener('click', () => {
    if (confirm('Clear all long-term memories? f0undr Ai will no longer recall these facts in future chats.')) {
      saveMemories([]);
    }
  });

  settingsMemoryList?.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.memory-item-delete');
    if (delBtn) {
      const idx = parseInt(delBtn.getAttribute('data-memory-index'), 10);
      if (!isNaN(idx)) {
        deleteMemory(idx);
      }
    }
  });
}

// Initialize app
initSidebar();
initUserSystem();
initPersonaSystem();
initMemorySystem();
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
    if (contextMenu && !contextMenu.contains(e.target)) {
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
    if (contextMenu && !contextMenu.classList.contains('hidden') && contextChatId) {
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
  attachedFile = null;
  if (fileInput) fileInput.value = '';
  filePreview?.classList.add('hidden');
  attachBtn?.classList.remove('has-file');
  thread.innerHTML = getWelcomeHTML();
  renderChatList();
  input.focus();
  if (window.innerWidth <= 768) closeSidebar();
}

function selectChat(id) {
  const chat = chats.find((c) => c.id === id);
  if (!chat) return;

  activeChatId = chat.id;
  chat.unread = false;
  if (chat.model) {
    setModel(chat.model);
  }
  saveChats();

  history = [...chat.messages];
  thread.innerHTML = '';

  if (!history.length) {
    thread.innerHTML = getWelcomeHTML();
  } else {
    for (const msg of history) {
      const body = addMessage(msg.role);
      if (msg.role === 'assistant') {
        renderMessageContent(body, msg.content);
      } else {
        const textContainer = document.createElement('div');
        textContainer.textContent = msg.content;
        body.appendChild(textContainer);
      }
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
  if (pickerTriggerIcon) {
    pickerTriggerIcon.style.fontFamily = '';
    pickerTriggerIcon.style.fontWeight = '';
  }
  if (model === 'genni 3') {
    if (pickerTriggerName) pickerTriggerName.textContent = 'genni 3';
    if (pickerTriggerTag) pickerTriggerTag.textContent = 'Omni';
    if (pickerTriggerIcon) {
      pickerTriggerIcon.textContent = '◈';
      pickerTriggerIcon.style.color = '#ec4899';
    }
    if (checkGenni3) checkGenni3.style.display = 'flex';
    if (checkGenni2) checkGenni2.style.display = 'none';
    if (checkGenni1) checkGenni1.style.display = 'none';
    if (checkAuto) checkAuto.style.display = 'none';
    if (checkLiquidNeural) checkLiquidNeural.style.display = 'none';
    if (checkNorthMiniCode) checkNorthMiniCode.style.display = 'none';
    input.placeholder = 'Ask genni 3 for deep research, apps, or images (e.g. "draw a cyberpunk city")…';
  } else if (model === 'genni 2') {
    if (pickerTriggerName) pickerTriggerName.textContent = 'genni 2';
    if (pickerTriggerTag) pickerTriggerTag.textContent = 'Deep Think';
    if (pickerTriggerIcon) {
      pickerTriggerIcon.textContent = '⚡';
      pickerTriggerIcon.style.color = '#a78bfa';
    }
    if (checkGenni2) checkGenni2.style.display = 'flex';
    if (checkGenni3) checkGenni3.style.display = 'none';
    if (checkGenni1) checkGenni1.style.display = 'none';
    if (checkAuto) checkAuto.style.display = 'none';
    if (checkLiquidNeural) checkLiquidNeural.style.display = 'none';
    if (checkNorthMiniCode) checkNorthMiniCode.style.display = 'none';
    input.placeholder = 'Ask genni 2 with Deep Reasoning & Code Runner…';
  } else if (model === 'liquid-neural' || model === 'genni 1.1' || model === 'genni ln') {
    if (pickerTriggerName) pickerTriggerName.textContent = 'Liquid Neural';
    if (pickerTriggerTag) pickerTriggerTag.textContent = 'LFM 2.5';
    if (pickerTriggerIcon) {
      pickerTriggerIcon.textContent = '💧';
      pickerTriggerIcon.style.color = '#06b6d4';
    }
    if (checkLiquidNeural) checkLiquidNeural.style.display = 'flex';
    if (checkGenni1) checkGenni1.style.display = 'none';
    if (checkGenni2) checkGenni2.style.display = 'none';
    if (checkGenni3) checkGenni3.style.display = 'none';
    if (checkAuto) checkAuto.style.display = 'none';
    if (checkNorthMiniCode) checkNorthMiniCode.style.display = 'none';
    input.placeholder = 'Send a message to Liquid Neural (lfm-2.5-2.6b)…';
  } else if (model === 'north-mini-code' || model === 'cohere/north-mini-code:free') {
    if (pickerTriggerName) pickerTriggerName.textContent = 'North Mini Code';
    if (pickerTriggerTag) pickerTriggerTag.textContent = 'Code';
    if (pickerTriggerIcon) {
      pickerTriggerIcon.textContent = '{ }';
      pickerTriggerIcon.style.color = '#10b981';
      pickerTriggerIcon.style.fontFamily = "'JetBrains Mono', monospace";
      pickerTriggerIcon.style.fontWeight = '700';
    }
    if (checkNorthMiniCode) checkNorthMiniCode.style.display = 'flex';
    if (checkGenni1) checkGenni1.style.display = 'none';
    if (checkGenni2) checkGenni2.style.display = 'none';
    if (checkGenni3) checkGenni3.style.display = 'none';
    if (checkAuto) checkAuto.style.display = 'none';
    if (checkLiquidNeural) checkLiquidNeural.style.display = 'none';
    input.placeholder = 'Ask North Mini Code for code, debugging, or reasoning…';
  } else if (model === 'auto') {
    if (pickerTriggerName) pickerTriggerName.textContent = 'Auto';
    if (pickerTriggerTag) pickerTriggerTag.textContent = 'Smart';
    if (pickerTriggerIcon) {
      pickerTriggerIcon.textContent = '✨';
      pickerTriggerIcon.style.color = '#eab308';
    }
    if (checkAuto) checkAuto.style.display = 'flex';
    if (checkGenni1) checkGenni1.style.display = 'none';
    if (checkGenni2) checkGenni2.style.display = 'none';
    if (checkGenni3) checkGenni3.style.display = 'none';
    if (checkLiquidNeural) checkLiquidNeural.style.display = 'none';
    if (checkNorthMiniCode) checkNorthMiniCode.style.display = 'none';
    input.placeholder = 'Ask anything (Auto routes between genni 1, 2 & 3)…';
  } else {
    if (pickerTriggerName) pickerTriggerName.textContent = 'genni 1';
    if (pickerTriggerTag) pickerTriggerTag.textContent = 'Fast';
    if (pickerTriggerIcon) {
      pickerTriggerIcon.textContent = '✦';
      pickerTriggerIcon.style.color = '';
    }
    if (checkGenni1) checkGenni1.style.display = 'flex';
    if (checkGenni2) checkGenni2.style.display = 'none';
    if (checkGenni3) checkGenni3.style.display = 'none';
    if (checkLiquidNeural) checkLiquidNeural.style.display = 'none';
    if (checkAuto) checkAuto.style.display = 'none';
    if (checkNorthMiniCode) checkNorthMiniCode.style.display = 'none';
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

  if (activeChatId) {
    const activeChat = chats.find((c) => c.id === activeChatId);
    if (activeChat && activeChat.model !== model) {
      activeChat.model = model;
      saveChats();
    }
  }

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
  closePersonaDropdown();
  toolsPopover?.classList.add('hidden');
  modelDropdownMenu.classList.remove('hidden');
  modelPickerContainer?.classList.add('open');
  modelPickerTrigger?.setAttribute('aria-expanded', 'true');
}

function closeModelDropdown() {
  if (!modelDropdownMenu) return;
  modelDropdownMenu.classList.add('hidden');
  modelPickerContainer?.classList.remove('open');
  moreModelsContainer?.classList.remove('open');
  modelPickerTrigger?.setAttribute('aria-expanded', 'false');
}

// Model dropdown listeners
modelPickerTrigger?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleModelDropdown();
});

moreModelsTrigger?.addEventListener('click', (e) => {
  e.stopPropagation();
  moreModelsContainer?.classList.toggle('open');
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

  // Auto-switch to genni 2 for document & code analysis only if on genni 1
  if (currentModel === 'genni 1') {
    setModel('genni 2');
  }

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
  const newH = Math.min(input.scrollHeight, 180);
  input.style.height = newH + 'px';
  input.style.overflowY = input.scrollHeight > 180 ? 'auto' : 'hidden';
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
  input.style.overflowY = 'hidden';
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
  detectAndSaveMemories(text);

  // If we don't have an active conversation, create one now
  if (!activeChatId) {
    const newChat = {
      id: 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: text.length > 28 ? text.slice(0, 28) + '…' : text,
      messages: [],
      model: currentModel,
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
  const isAuto = currentModel === 'auto';
  const isGenni3 = currentModel === 'genni 3';
  const autoWantsImage = isAuto && /^(?:generate|create|draw|paint)\s+(?:an?\s+)?(?:image|picture|photo|wallpaper|illustration)\s+of\b/i.test(text.trim()) && !/(?:code|html|css|js|canvas|react|app|game|svg|script)/i.test(text);
  const autoNeedsReasoning = isAuto && !autoWantsImage && (Boolean(userFile) || /(code|debug|function|algorithm|math|solve|step by step|prove|analyze|detailed|explain why)/i.test(text));
  const isGenni2 = currentModel === 'genni 2' || autoNeedsReasoning;
  const isReasoningModel = isGenni2 || isNorth || isGenni3 || autoWantsImage;
  let noteText = (isGenni3 || autoWantsImage)
    ? 'Omni Studio (Thinking & Creating)'
    : (isGenni2
        ? 'Deep Thinking'
        : (isNorth
            ? 'Reasoning (North Mini Code)'
            : (currentModel === 'liquid-neural' || currentModel === 'genni 1.1' || currentModel === 'genni ln' ? 'Thinking (Liquid Neural)' : 'Thinking')));
  let note = addNote(noteText);
  let answer = '';
  let thoughtBox = null;
  let thoughtContent = null;

  try {
    await stream({
      messages: history,
      model: currentModel,
      file: userFile,
      personalization: userPersonalization,
      memories: loadMemories(),
      persona: currentPersona
    }, (msg) => {
      switch (msg.event) {
        case 'status':
          if (note.isConnected) note.lastChild.textContent = msg.text;
          break;
        case 'thought':
          if (note.isConnected) note.remove();
          if (!thoughtBox) {
            thoughtBox = document.createElement('details');
            thoughtBox.className = 'thought-box';
            thoughtBox.open = true;
            const spark = isNorth ? '{ }' : ((isGenni3 || autoWantsImage) ? '◈' : '⚡');
            const titleText = isNorth ? 'Code Reasoning' : ((isGenni3 || autoWantsImage) ? 'Omni Reasoning' : 'Deep Thinking');
            thoughtBox.innerHTML = `
              <summary class="thought-summary">
                <span class="thought-sparkle">${spark}</span>
                <span class="thought-title">${titleText}</span>
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
          break;
        case 'token':
          if (note.isConnected) note.remove();
          if (thoughtBox && !thoughtBox.dataset.finalized) {
            thoughtBox.dataset.finalized = 'true';
            thoughtBox.open = false;
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
            thoughtBox.open = false;
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
      currentChat.model = currentModel;
      currentChat.updatedAt = Date.now();
      saveChats();
      renderChatList();
    }

    // Auto-open in Canvas if AppDeploy was triggered or user asked for an interactive app
    if (window._autoOpenCanvasOnComplete || /(?:build|create|code|deploy|generate)\s+(?:an?\s+)?(?:web\s+app|interactive\s+app|game|calculator|dashboard|tool|widget|html\s+page)/i.test(text)) {
      window._autoOpenCanvasOnComplete = false;
      const htmlBlockMatch = answer.match(/```(?:html|htm|svg)\n?([\s\S]*?)```/i);
      if (htmlBlockMatch && htmlBlockMatch[1]) {
        setTimeout(() => {
          openCanvas({
            title: 'Interactive Web App',
            code: htmlBlockMatch[1].trim(),
            lang: 'html',
            badge: 'LIVE APP'
          });
        }, 200);
      }
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
  renderMermaidDiagrams(answerContainer);
}

function renderMermaidDiagrams(container) {
  if (!window.mermaid) return;
  const els = container.querySelectorAll('.mermaid-body:not([data-processed])');
  els.forEach(async (el) => {
    const rawCode = el.getAttribute('data-code') || el.textContent;
    if (!rawCode || !rawCode.trim()) return;
    try {
      const id = 'svg_' + Math.random().toString(36).slice(2, 9);
      const { svg } = await window.mermaid.render(id, rawCode.trim());
      el.innerHTML = svg;
      el.setAttribute('data-processed', 'true');
    } catch {
      // In case incomplete syntax while streaming, let it retry on next render or final
    }
  });
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

/** Comprehensive ChatGPT / Gemini / Claude style Markdown renderer with tables, lists, quotes, headings, code preview, KaTeX math & Mermaid diagrams. */
function render(md) {
  if (!md) return '';
  const esc = escapeHtml;
  const blocks = [];

  // 0. Extract display math $$ ... $$ and \[ ... \]
  let text = md.replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g, (_, tex1, tex2) => {
    const formula = (tex1 || tex2 || '').trim();
    let rendered;
    try {
      rendered = window.katex
        ? katex.renderToString(formula, { displayMode: true, throwOnError: false })
        : `<div class="katex-display-block">$$${esc(formula)}$$</div>`;
    } catch {
      rendered = `<div class="katex-display-block">$$${esc(formula)}$$</div>`;
    }
    blocks.push(`<div class="katex-display-block">${rendered}</div>`);
    return `\u0000${blocks.length - 1}\u0000`;
  });

  // 1. Extract code blocks ```lang ... ``` and ```mermaid ... ```
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, rawCode) => {
    const code = rawCode.trim();
    // If model wrapped markdown image inside ```markdown or ```, unwrap it so it displays as an image card
    if (['markdown', 'md', ''].includes(l) && code.startsWith('![')) {
      return `\n\n${code}\n\n`;
    }

    // Native Mermaid Diagrams
    if (l === 'mermaid') {
      const diagramId = 'mermaid_' + Math.random().toString(36).slice(2, 9);
      const header = `
        <div class="code-header">
          <span>MERMAID DIAGRAM</span>
          <div class="code-actions">
            <button type="button" class="code-btn copy-btn" data-target="${diagramId}">Copy Code</button>
          </div>
        </div>
      `;
      const body = `<div class="mermaid-body" id="${diagramId}" data-code="${esc(code)}">${esc(code)}</div>`;
      blocks.push(`<div class="code-block-wrap mermaid-diagram-wrap">${header}${body}</div>`);
      return `\u0000${blocks.length - 1}\u0000`;
    }

    const isHtmlOrSvg = ['html', 'svg', 'xml'].includes(l);
    const codeId = 'code_' + Math.random().toString(36).slice(2, 9);

    const header = `
      <div class="code-header">
        <span>${esc(l.toUpperCase())}</span>
        <div class="code-actions">
          <button type="button" class="code-btn canvas-btn" data-target="${codeId}" data-lang="${esc(l)}">⚡ Open in Canvas</button>
          ${isHtmlOrSvg ? `<button type="button" class="code-btn preview-btn" data-target="${codeId}">▶ Inline Preview</button>` : ''}
          <button type="button" class="code-btn download-btn" data-target="${codeId}" data-lang="${esc(l)}">Download</button>
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

  // 3. Inline elements parser: math, images, bold, italic, code, links, del
  const parseInline = (s) => {
    return s
      // Inline LaTeX math: $formula$ or \(formula\)
      .replace(/(?<!\\)\$([^\$\n]+?)\$(?!\$)|\\\(([\s\S]+?)\\\)/g, (_, tex1, tex2) => {
        const formula = (tex1 || tex2 || '').trim();
        if (!formula) return '';
        try {
          if (window.katex) {
            return katex.renderToString(formula, { displayMode: false, throwOnError: false });
          }
        } catch {}
        return `<code>${formula}</code>`;
      })
      .replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, (_, alt, url) => {
        const cleanUrl = url
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '')
          .replace(/"/g, '')
          .trim()
          .replace(/\s+/g, '%20');
        const cleanAlt = alt || 'f0undr Ai Generated Image';
        return (
          '<div class="generated-image-card">' +
            '<div class="generated-image-container zoomable-image-wrap" data-url="' + cleanUrl + '" data-caption="' + cleanAlt + '">' +
              `<img src="${cleanUrl}" alt="${cleanAlt}" loading="lazy" />` +
            '</div>' +
            '<div class="generated-image-bar">' +
              `<span class="generated-image-caption">◈ ${cleanAlt}</span>` +
              '<div class="generated-image-actions">' +
                `<button type="button" class="generated-image-btn zoom-btn" data-url="${cleanUrl}" data-caption="${cleanAlt}">Zoom</button>` +
                `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="generated-image-btn">Full Res</a>` +
                `<a href="${cleanUrl}" download="foundr-ai-art.jpg" target="_blank" class="generated-image-btn">Download</a>` +
              '</div>' +
            '</div>' +
          '</div>'
        );
      })
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

// Global delegated click for code block actions (Copy & Live Preview & Canvas)
document.addEventListener('click', (e) => {
  const canvasBtn = e.target.closest('.canvas-btn');
  if (canvasBtn) {
    const targetId = canvasBtn.dataset.target;
    const lang = (canvasBtn.dataset.lang || 'html').toLowerCase();
    const codeEl = document.getElementById(targetId);
    if (codeEl) {
      const code = codeEl.textContent;
      const title = ['html', 'js', 'javascript'].includes(lang) ? 'Interactive Web App' : `${lang.toUpperCase()} Workspace`;
      openCanvas({ title, code, lang, badge: lang.toUpperCase() });
    }
    return;
  }

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
    return;
  }

  const downloadBtn = e.target.closest('.download-btn');
  if (downloadBtn) {
    const targetId = downloadBtn.dataset.target;
    const lang = (downloadBtn.dataset.lang || 'code').toLowerCase();
    const codeEl = document.getElementById(targetId);
    if (codeEl) {
      const extMap = {
        html: 'html', js: 'js', javascript: 'js', css: 'css',
        python: 'py', py: 'py', json: 'json', ts: 'ts',
        typescript: 'ts', svg: 'svg', xml: 'xml', markdown: 'md', md: 'md'
      };
      const ext = extMap[lang] || 'txt';
      const blob = new Blob([codeEl.textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foundr-${lang}-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return;
  }

  // Lightbox Zoom Handler
  const zoomBtn = e.target.closest('.zoom-btn');
  const zoomWrap = e.target.closest('.zoomable-image-wrap');
  if (zoomBtn || zoomWrap) {
    const el = zoomBtn || zoomWrap;
    const url = el.dataset.url;
    const caption = el.dataset.caption || 'f0undr Ai Generated Visual';
    if (url) {
      openImageLightbox(url, caption);
    }
    return;
  }
});

// Image Lightbox Elements
const lightboxModal = document.getElementById('image-lightbox');
const lightboxImg = document.getElementById('image-lightbox-img');
const lightboxCaption = document.getElementById('image-lightbox-caption');
const lightboxDl = document.getElementById('image-lightbox-dl');
const lightboxOpen = document.getElementById('image-lightbox-open');
const lightboxClose = document.getElementById('image-lightbox-close');
const lightboxBackdrop = document.getElementById('image-lightbox-backdrop');

function openImageLightbox(url, caption) {
  if (!lightboxModal) return;
  if (lightboxImg) lightboxImg.src = url;
  if (lightboxCaption) lightboxCaption.textContent = caption;
  if (lightboxDl) lightboxDl.href = url;
  if (lightboxOpen) lightboxOpen.href = url;
  lightboxModal.classList.remove('hidden');
}

function closeImageLightbox() {
  if (!lightboxModal) return;
  lightboxModal.classList.add('hidden');
  if (lightboxImg) lightboxImg.src = '';
}

lightboxClose?.addEventListener('click', closeImageLightbox);
lightboxBackdrop?.addEventListener('click', closeImageLightbox);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightboxModal && !lightboxModal.classList.contains('hidden')) {
    closeImageLightbox();
  }
});

// Initialize Mermaid.js for flowcharts, diagrams and mind maps
if (window.mermaid) {
  try {
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif'
    });
  } catch {}
}

function initUserSystem() {
  updateUserUI();

  // User Pill click toggles popover (Image 1)
  sidebarUserPill?.addEventListener('click', (e) => {
    e.stopPropagation();
    userPopover?.classList.toggle('hidden');
  });

  // Close user popover on outside click
  document.addEventListener('click', (e) => {
    if (userPopover && !userPopover.contains(e.target) && !sidebarUserPill?.contains(e.target)) {
      userPopover.classList.add('hidden');
    }
  });

  // User Popover buttons
  const popoverMemoryBtn = document.getElementById('popover-memory-btn');
  popoverMemoryBtn?.addEventListener('click', () => {
    userPopover?.classList.add('hidden');
    openSettingsModal('memory');
  });

  popoverUserCard?.addEventListener('click', () => {
    userPopover?.classList.add('hidden');
    openSettingsModal('profile');
  });

  popoverPlusBtn?.addEventListener('click', () => {
    userPopover?.classList.add('hidden');
    openUpgradeModal();
  });

  claimOfferBtn?.addEventListener('click', () => {
    openUpgradeModal();
  });

  popoverPersonalizationBtn?.addEventListener('click', () => {
    userPopover?.classList.add('hidden');
    openSettingsModal('personalization');
  });

  popoverProfileBtn?.addEventListener('click', () => {
    userPopover?.classList.add('hidden');
    openSettingsModal('profile');
  });

  popoverSettingsBtn?.addEventListener('click', () => {
    userPopover?.classList.add('hidden');
    openSettingsModal('profile');
  });

  // Settings Tabs listener
  document.querySelectorAll('[data-settings-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-settings-tab');
      if (tab) switchSettingsTab(tab);
    });
  });

  // Settings Name Save
  const settingsNameSaveBtn = document.getElementById('settings-name-save-btn');
  const settingsNameInput = document.getElementById('settings-name-input');
  settingsNameSaveBtn?.addEventListener('click', () => {
    const newName = (settingsNameInput?.value || '').trim();
    if (newName) {
      currentUser.name = newName.charAt(0).toUpperCase() + newName.slice(1);
      currentUser.initials = newName.slice(0, 2).toUpperCase();
      saveUser();
      settingsNameSaveBtn.textContent = 'Saved!';
      setTimeout(() => { settingsNameSaveBtn.textContent = 'Save Name'; }, 1500);
    }
  });

  // Settings Personalization Save
  const settingsSavePersonalizationBtn = document.getElementById('settings-save-personalization-btn');
  const settingsUserBio = document.getElementById('settings-user-bio');
  const settingsResponseStyle = document.getElementById('settings-response-style');
  settingsSavePersonalizationBtn?.addEventListener('click', () => {
    const bio = settingsUserBio?.value.trim() || '';
    const style = settingsResponseStyle?.value.trim() || '';
    savePersonalization(bio, style);
    settingsSavePersonalizationBtn.textContent = 'Saved!';
    setTimeout(() => { settingsSavePersonalizationBtn.textContent = 'Save Instructions'; }, 1500);
  });

  // Settings Export Chats
  const settingsExportChatsBtn = document.getElementById('settings-export-chats-btn');
  settingsExportChatsBtn?.addEventListener('click', () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: currentUser,
      memories,
      personalization: userPersonalization,
      chats
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foundr-ai-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  popoverHelpBtn?.addEventListener('click', () => {
    userPopover?.classList.add('hidden');
    alert('f0undr Ai Help Center:\n\n• genni 1: Ultra-fast conversational search with live web intelligence.\n• genni 2: Deep reasoning, file analysis, and live code preview.\n• genni 3: Omni Studio flagship with live image creation & Mermaid diagrams.\n\nAll official models are 100% free with no API key needed.');
  });

  popoverAuthBtn?.addEventListener('click', () => {
    userPopover?.classList.add('hidden');
    if (currentUser.isGuest) {
      openAuthModal();
    } else {
      // Log out -> Switch to guest
      currentUser = {
        name: 'Guest',
        initials: 'G',
        plan: 'Guest',
        email: '',
        isGuest: true
      };
      saveUser();
      openAuthModal();
    }
  });

  // Top Nav Tabs (Image 2)
  tabChat?.addEventListener('click', () => {
    tabChat.classList.add('active');
    tabWork?.classList.remove('active');
  });

  tabWork?.addEventListener('click', () => {
    tabWork.classList.add('active');
    tabChat?.classList.remove('active');
    setModel('genni 2');
    input.placeholder = 'Describe a work project, document analysis, or code task…';
    input.focus();
  });

  // Composer "+" Tools Popover (Image 2)
  toolsMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModelDropdown();
    closePersonaDropdown();
    toolsPopover?.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (toolsPopover && !toolsPopover.contains(e.target) && !toolsMenuBtn?.contains(e.target)) {
      toolsPopover.classList.add('hidden');
    }
  });

  toolUploadBtn?.addEventListener('click', () => {
    toolsPopover?.classList.add('hidden');
    fileInput?.click();
  });

  toolImageBtn?.addEventListener('click', () => {
    toolsPopover?.classList.add('hidden');
    setModel('genni 3');
    input.value = 'Generate an image of ';
    input.focus();
  });

  toolSearchBtn?.addEventListener('click', () => {
    toolsPopover?.classList.add('hidden');
    setModel('genni 1');
    input.placeholder = 'Search live web facts with genni 1…';
    input.focus();
  });

  toolResearchBtn?.addEventListener('click', () => {
    toolsPopover?.classList.add('hidden');
    setModel('genni 2');
    input.placeholder = 'Enter a complex topic for genni 2 deep research…';
    input.focus();
  });

  toolThinkingBtn?.addEventListener('click', () => {
    toolsPopover?.classList.add('hidden');
    setModel('genni 2');
    input.placeholder = 'Ask a question with step-by-step reasoning…';
    input.focus();
  });

  toolAppdeployBtn?.addEventListener('click', () => {
    toolsPopover?.classList.add('hidden');
    setModel('genni 3');
    window._autoOpenCanvasOnComplete = true;
    input.value = 'Build a complete interactive web app for ';
    input.focus();
  });

  // Auth Modal
  authModalClose?.addEventListener('click', closeAuthModal);
  authModalBackdrop?.addEventListener('click', closeAuthModal);

  authTabLogin?.addEventListener('click', () => {
    authTabLogin.classList.add('active');
    authTabSignup?.classList.remove('active');
    if (authField) authField.style.display = 'none';
    if (authSubmitBtn) authSubmitBtn.textContent = 'Log In';
  });

  authTabSignup?.addEventListener('click', () => {
    authTabSignup.classList.add('active');
    authTabLogin?.classList.remove('active');
    if (authField) authField.style.display = 'block';
    if (authSubmitBtn) authSubmitBtn.textContent = 'Sign Up';
  });

  quickLoginHuzaifa?.addEventListener('click', () => {
    currentUser = {
      name: 'Huzaifa',
      initials: 'HU',
      plan: 'Free',
      email: 'huzaifa@foundr.ai',
      isGuest: false
    };
    saveUser();
    closeAuthModal();
  });

  guestContinueBtn?.addEventListener('click', () => {
    currentUser = {
      name: 'Guest',
      initials: 'G',
      plan: 'Guest',
      email: '',
      isGuest: true
    };
    saveUser();
    closeAuthModal();
  });

  authForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const isSignup = authTabSignup?.classList.contains('active');
    const enteredName = isSignup && authInputName?.value.trim() ? authInputName.value.trim() : (authInputEmail?.value.split('@')[0] || 'Huzaifa');
    const email = authInputEmail?.value.trim() || 'huzaifa@foundr.ai';
    currentUser = {
      name: enteredName.charAt(0).toUpperCase() + enteredName.slice(1),
      initials: enteredName.slice(0, 2).toUpperCase(),
      plan: 'Free',
      email,
      isGuest: false
    };
    saveUser();
    closeAuthModal();
  });

  // Personalization Modal
  personalizationClose?.addEventListener('click', closePersonalizationModal);
  personalizationBackdrop?.addEventListener('click', closePersonalizationModal);
  personalizationForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const bio = customUserBio?.value.trim() || '';
    const style = customResponseStyle?.value.trim() || '';
    savePersonalization(bio, style);
    closePersonalizationModal();
  });

  // Settings Modal
  settingsClose?.addEventListener('click', closeSettingsModal);
  settingsBackdrop?.addEventListener('click', closeSettingsModal);
  settingsAuthSwitchBtn?.addEventListener('click', () => {
    closeSettingsModal();
    openAuthModal();
  });
  settingsClearChatsBtn?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all conversations? This cannot be undone.')) {
      chats = [];
      saveChats();
      renderChatList();
      startNewChat();
      closeSettingsModal();
    }
  });

  // Upgrade Modal
  upgradeClose?.addEventListener('click', closeUpgradeModal);
  upgradeBackdrop?.addEventListener('click', closeUpgradeModal);
  upgradeClaimBtn?.addEventListener('click', () => {
    closeUpgradeModal();
  });
}

function openAuthModal() {
  authModal?.classList.remove('hidden');
}

function closeAuthModal() {
  authModal?.classList.add('hidden');
}

function openPersonalizationModal() {
  if (customUserBio) customUserBio.value = userPersonalization.bio || '';
  if (customResponseStyle) customResponseStyle.value = userPersonalization.style || '';
  personalizationModal?.classList.remove('hidden');
}

function closePersonalizationModal() {
  personalizationModal?.classList.add('hidden');
}

function openSettingsModal(defaultTab = 'profile') {
  if (settingsUserDesc) {
    settingsUserDesc.textContent = currentUser.isGuest
      ? 'Browsing on Guest Account'
      : `Logged in as ${currentUser.name} (${currentUser.email || 'Free Account'})`;
  }

  const settingsNameInput = document.getElementById('settings-name-input');
  const settingsProfileEmail = document.getElementById('settings-profile-email');
  const settingsProfileAvatar = document.getElementById('settings-profile-avatar');
  const settingsUserBio = document.getElementById('settings-user-bio');
  const settingsResponseStyle = document.getElementById('settings-response-style');

  if (settingsNameInput) settingsNameInput.value = currentUser.name || '';
  if (settingsProfileEmail) settingsProfileEmail.textContent = currentUser.email || 'huzaifa@foundr.ai';
  if (settingsProfileAvatar) {
    settingsProfileAvatar.textContent = currentUser.isGuest ? 'G' : (currentUser.initials || 'HU');
  }

  if (settingsUserBio) settingsUserBio.value = userPersonalization.bio || '';
  if (settingsResponseStyle) settingsResponseStyle.value = userPersonalization.style || '';

  renderMemorySettingsList();
  switchSettingsTab(defaultTab);
  settingsModal?.classList.remove('hidden');
}

function switchSettingsTab(tabName) {
  const tabs = document.querySelectorAll('[data-settings-tab]');
  tabs.forEach((btn) => {
    const isTarget = btn.getAttribute('data-settings-tab') === tabName;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  const paneMap = {
    profile: document.getElementById('settings-pane-profile'),
    memory: document.getElementById('settings-pane-memory'),
    personalization: document.getElementById('settings-pane-personalization'),
    data: document.getElementById('settings-pane-data')
  };

  Object.entries(paneMap).forEach(([key, pane]) => {
    if (pane) {
      pane.classList.toggle('hidden', key !== tabName);
      pane.classList.toggle('active', key === tabName);
    }
  });

  if (tabName === 'memory') {
    renderMemorySettingsList();
  }
}

function closeSettingsModal() {
  settingsModal?.classList.add('hidden');
}

function openUpgradeModal() {
  upgradeModal?.classList.remove('hidden');
}

function closeUpgradeModal() {
  upgradeModal?.classList.add('hidden');
}

// ---------------------------------------------------------------- Canvas System (Claude & ChatGPT Style)

const canvasPanel = document.getElementById('canvas-panel');
const canvasTitle = document.getElementById('canvas-title');
const canvasBadge = document.getElementById('canvas-badge');
const canvasTabPreview = document.getElementById('canvas-tab-preview');
const canvasTabCode = document.getElementById('canvas-tab-code');
const canvasTabConsole = document.getElementById('canvas-tab-console');
const canvasConsoleCount = document.getElementById('canvas-console-count');
const canvasRefreshBtn = document.getElementById('canvas-refresh-btn');
const canvasCopyBtn = document.getElementById('canvas-copy-btn');
const canvasDownloadBtn = document.getElementById('canvas-download-btn');
const canvasFullscreenBtn = document.getElementById('canvas-fullscreen-btn');
const canvasCloseBtn = document.getElementById('canvas-close-btn');
const canvasOpenTabBtn = document.getElementById('canvas-open-tab-btn');
const canvasFixBtn = document.getElementById('canvas-fix-btn');

const canvasPreviewView = document.getElementById('canvas-preview-view');
const canvasCodeView = document.getElementById('canvas-code-view');
const canvasConsoleView = document.getElementById('canvas-console-view');
const canvasIframe = document.getElementById('canvas-iframe');
const canvasCodeContent = document.getElementById('canvas-code-content');
const canvasConsoleLogs = document.getElementById('canvas-console-logs');
const canvasConsoleClear = document.getElementById('canvas-console-clear');
const canvasErrorBanner = document.getElementById('canvas-error-banner');
const canvasErrorMsg = document.getElementById('canvas-error-msg');
const canvasErrorFixBtn = document.getElementById('canvas-error-fix-btn');

let currentCanvasArtifact = null;
let canvasConsoleErrorCount = 0;
let lastCanvasError = '';

function openCanvas({ title = 'Interactive Canvas', code = '', lang = 'html', badge = 'App' }) {
  if (!canvasPanel) return;
  currentCanvasArtifact = { title, code, lang, badge };

  if (canvasTitle) canvasTitle.textContent = title;
  if (canvasBadge) canvasBadge.textContent = badge || lang.toUpperCase();

  // Populate code view
  if (canvasCodeContent) canvasCodeContent.textContent = code;

  // Clear console logs
  clearCanvasConsole();

  // Prepare & run in iframe
  runCanvasPreview(code, lang);

  // Switch to preview view if HTML/SVG/JS, else Code view
  const isRunnable = ['html', 'htm', 'svg', 'xml', 'js', 'javascript'].includes((lang || '').toLowerCase());
  switchCanvasTab(isRunnable ? 'preview' : 'code');

  // Open Canvas panel
  canvasPanel.classList.remove('collapsed');
  if (window.innerWidth <= 768) closeSidebar();
}

function closeCanvas() {
  if (!canvasPanel) return;
  canvasPanel.classList.add('collapsed');
  canvasPanel.classList.remove('fullscreen');
  if (canvasIframe) canvasIframe.srcdoc = '';
}

function toggleCanvasFullscreen() {
  if (!canvasPanel) return;
  canvasPanel.classList.toggle('fullscreen');
}

function switchCanvasTab(tabName) {
  canvasTabPreview?.classList.toggle('active', tabName === 'preview');
  canvasTabCode?.classList.toggle('active', tabName === 'code');
  canvasTabConsole?.classList.toggle('active', tabName === 'console');

  canvasPreviewView?.classList.toggle('hidden', tabName !== 'preview');
  canvasCodeView?.classList.toggle('hidden', tabName !== 'code');
  canvasConsoleView?.classList.toggle('hidden', tabName !== 'console');

  if (tabName === 'console') {
    canvasConsoleErrorCount = 0;
    if (canvasConsoleCount) {
      canvasConsoleCount.classList.add('hidden');
      canvasConsoleCount.textContent = '0';
    }
  }
}

function prepareCanvasHtml(code, lang) {
  const bridgeScript = `
<script>
(function() {
  const send = (level, args) => {
    try {
      const text = Array.from(args).map(a => {
        if (typeof a === 'object') {
          try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); }
        }
        return String(a);
      }).join(' ');
      window.parent.postMessage({ type: 'canvas-log', level, text }, '*');
    } catch(e) {}
  };
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;
  console.log = function(...args) { send('log', args); origLog.apply(console, args); };
  console.warn = function(...args) { send('warn', args); origWarn.apply(console, args); };
  console.error = function(...args) { send('error', args); origError.apply(console, args); };
  window.onerror = function(msg, url, line) {
    send('error', [msg + (line ? ' (line ' + line + ')' : '')]);
  };
  window.addEventListener('unhandledrejection', function(e) {
    send('error', [(e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled Promise Rejection')]);
  });
})();
<\/script>
`;

  const l = (lang || '').toLowerCase();
  if (l === 'svg') {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;}svg{max-width:95vw;max-height:95vh;}</style></head><body>${code}</body></html>`;
  }

  if (l === 'js' || l === 'javascript') {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${bridgeScript}<style>body{font-family:system-ui,-apple-system,sans-serif;padding:20px;color:#1e293b;}</style></head><body><div id="app"></div><script>${code}<\/script></body></html>`;
  }

  if (code.includes('<head>')) {
    return code.replace('<head>', '<head>' + bridgeScript);
  } else if (code.includes('<html>')) {
    return code.replace('<html>', '<html><head>' + bridgeScript + '</head>');
  } else {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>${bridgeScript}</head><body style="margin:0;font-family:system-ui,-apple-system,sans-serif;">${code}</body></html>`;
  }
}

function runCanvasPreview(code, lang) {
  if (!canvasIframe) return;
  const html = prepareCanvasHtml(code, lang);
  canvasIframe.srcdoc = html;
}

function clearCanvasConsole() {
  if (!canvasConsoleLogs) return;
  canvasConsoleLogs.innerHTML = '<div class="canvas-log-item info">Canvas console ready. Logs and runtime events from the interactive app will appear here.</div>';
  canvasConsoleErrorCount = 0;
  if (canvasConsoleCount) {
    canvasConsoleCount.classList.add('hidden');
    canvasConsoleCount.textContent = '0';
  }
  hideCanvasError();
}

function showCanvasError(errorText) {
  lastCanvasError = errorText || 'Runtime error in script';
  if (canvasErrorMsg) canvasErrorMsg.textContent = lastCanvasError;
  canvasErrorBanner?.classList.remove('hidden');
  canvasFixBtn?.classList.remove('hidden');
}

function hideCanvasError() {
  lastCanvasError = '';
  canvasErrorBanner?.classList.add('hidden');
  canvasFixBtn?.classList.add('hidden');
}

function autoFixCanvasWithGenni3() {
  if (!currentCanvasArtifact || !currentCanvasArtifact.code || busy) return;
  const errText = lastCanvasError || 'Runtime exception caught in sandbox console';
  hideCanvasError();
  // Ensure we switch to genni 3 flagship for debugging & repair
  setModel('genni 3');

  const fixPrompt = `Please debug and repair the following interactive Canvas app code. It encountered a runtime error:\n\n` +
    `**Runtime Error Log:**\n\`\`\`\n${errText}\n\`\`\`\n\n` +
    `**Current Code:**\n\`\`\`${currentCanvasArtifact.lang || 'html'}\n${currentCanvasArtifact.code}\n\`\`\`\n\n` +
    `Fix all syntax and runtime issues, ensure full error safety, and return the complete, working single-file HTML code in a \`\`\`html block so it runs smoothly in Canvas.`;

  ask(fixPrompt);
}

function openCanvasInNewTab() {
  if (!currentCanvasArtifact || !currentCanvasArtifact.code) return;
  const fullHtml = prepareCanvasHtml(currentCanvasArtifact.code, currentCanvasArtifact.lang);
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

function addCanvasLog(level, text) {
  if (!canvasConsoleLogs) return;
  const item = document.createElement('div');
  item.className = 'canvas-log-item ' + (level || 'log');
  item.textContent = `[${(level || 'log').toUpperCase()}] ${text}`;
  canvasConsoleLogs.appendChild(item);
  canvasConsoleLogs.scrollTop = canvasConsoleLogs.scrollHeight;

  if (level === 'error' || level === 'warn') {
    canvasConsoleErrorCount++;
    if (canvasConsoleCount && !canvasTabConsole?.classList.contains('active')) {
      canvasConsoleCount.textContent = String(canvasConsoleErrorCount);
      canvasConsoleCount.classList.remove('hidden');
    }
    if (level === 'error') {
      showCanvasError(text);
    }
  }
}

// Listen for sandbox console messages
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'canvas-log') {
    addCanvasLog(e.data.level, e.data.text);
  }
});

// Canvas view buttons
canvasTabPreview?.addEventListener('click', () => switchCanvasTab('preview'));
canvasTabCode?.addEventListener('click', () => switchCanvasTab('code'));
canvasTabConsole?.addEventListener('click', () => switchCanvasTab('console'));
canvasConsoleClear?.addEventListener('click', clearCanvasConsole);

// Canvas action buttons
canvasRefreshBtn?.addEventListener('click', () => {
  if (currentCanvasArtifact) {
    clearCanvasConsole();
    runCanvasPreview(currentCanvasArtifact.code, currentCanvasArtifact.lang);
  }
});

canvasFullscreenBtn?.addEventListener('click', toggleCanvasFullscreen);
canvasCloseBtn?.addEventListener('click', closeCanvas);

canvasOpenTabBtn?.addEventListener('click', openCanvasInNewTab);
canvasFixBtn?.addEventListener('click', autoFixCanvasWithGenni3);
canvasErrorFixBtn?.addEventListener('click', autoFixCanvasWithGenni3);

canvasCopyBtn?.addEventListener('click', () => {
  if (!currentCanvasArtifact) return;
  navigator.clipboard.writeText(currentCanvasArtifact.code).then(() => {
    canvasCopyBtn.style.color = '#10b981';
    setTimeout(() => { canvasCopyBtn.style.color = ''; }, 1200);
  });
});

canvasDownloadBtn?.addEventListener('click', () => {
  if (!currentCanvasArtifact) return;
  const lang = (currentCanvasArtifact.lang || 'html').toLowerCase();
  const extMap = { html: 'html', js: 'js', css: 'css', svg: 'svg', xml: 'xml', py: 'py', json: 'json', ts: 'ts' };
  const ext = extMap[lang] || 'txt';
  const blob = new Blob([currentCanvasArtifact.code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `canvas-${lang}-${Date.now()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});





