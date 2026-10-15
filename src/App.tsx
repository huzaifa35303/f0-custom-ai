import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type {
  ChatSession,
  ChatMessage,
  AppSettings,
  SearchModeType,
  SearchSource,
  SearchTelemetry,
  SearchActivityStep
} from './types';
import { DEFAULT_SYSTEM_PROMPT } from './utils/systemPrompt';
import { processAssistantResponse } from './services/aiProvider';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { EmptyState } from './components/EmptyState';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput } from './components/ChatInput';
import { SystemPromptModal } from './components/SystemPromptModal';
import { SettingsModal } from './components/SettingsModal';
import { SourcePreviewModal } from './components/SourcePreviewModal';
import { SearchProcessCard } from './components/SearchProcessCard';

const STORAGE_KEYS = {
  SESSIONS: 'f0_ai_sessions_v1',
  ACTIVE_ID: 'f0_ai_active_session_id',
  SETTINGS: 'f0_ai_settings_v1'
};

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'builtin',
  apiKey: '',
  searchMode: 'smart',
  maxQueries: 3,
  theme: 'studio',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  autoVoice: false
};

export function App() {
  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID) || null;
    } catch {
      return null;
    }
  });

  // Modals
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewSource, setPreviewSource] = useState<SearchSource | null>(null);

  // Streaming & Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeTelemetry, setActiveTelemetry] = useState<SearchTelemetry | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Sync sessions
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  // Sync active session id
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, activeSessionId);
    }
  }, [activeSessionId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, streamingContent, activeTelemetry]);

  // Current Session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  // Create New Session
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Search Thread',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setStreamingContent('');
    setActiveTelemetry(null);
  };

  // Delete Session
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Toggle Pin
  const handleTogglePinSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  // Rename Session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  // Clear All Sessions
  const handleClearHistory = () => {
    setSessions([]);
    setActiveSessionId(null);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
  };

  // Export History JSON
  const handleExportHistory = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `f0_custom_ai_history_${Date.now()}.json`);
    dlAnchor.click();
  };

  // Export Current Session Markdown
  const handleExportMarkdown = () => {
    if (!activeSession || activeSession.messages.length === 0) {
      alert('No messages in the active thread to export.');
      return;
    }

    let md = `# ${activeSession.title}\nExported from f0 custom ai on ${new Date().toLocaleString()}\n\n---\n\n`;
    for (const msg of activeSession.messages) {
      const sender = msg.role === 'user' ? '### User' : '### f0 custom ai';
      md += `${sender}\n\n${msg.content}\n\n`;
      if (msg.telemetry && msg.telemetry.sources.length > 0) {
        md += `**Sources Grounded:**\n`;
        msg.telemetry.sources.forEach((s) => {
          md += `- [${s.title}](${s.url})\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    link.click();
  };

  // Send Message Flow
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    let targetSessionId = activeSessionId;
    let currentSessions = [...sessions];

    // Create session if none exists
    if (!targetSessionId || !currentSessions.some((s) => s.id === targetSessionId)) {
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: text.slice(0, 32) + (text.length > 32 ? '...' : ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: []
      };
      currentSessions = [newSession, ...currentSessions];
      targetSessionId = newSession.id;
      setSessions(currentSessions);
      setActiveSessionId(targetSessionId);
    }

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    // Update session title if first message
    const sess = currentSessions.find((s) => s.id === targetSessionId)!;
    if (sess.messages.length === 0) {
      sess.title = text.slice(0, 34) + (text.length > 34 ? '...' : '');
    }
    sess.messages.push(userMessage);
    sess.updatedAt = Date.now();
    setSessions([...currentSessions]);

    // Start Assistant Pipeline
    setIsLoading(true);
    setStreamingContent('');
    setActiveTelemetry(null);

    try {
      const assistantMessage = await processAssistantResponse(
        text,
        sess.messages,
        settings,
        {
          onTelemetryReady: (telem) => {
            setActiveTelemetry(telem);
          },
          onContentChunk: (_chunk, full) => {
            setStreamingContent(full);
          },
          onComplete: (msg) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === targetSessionId) {
                  return {
                    ...s,
                    updatedAt: Date.now(),
                    messages: [...s.messages, msg]
                  };
                }
                return s;
              })
            );
            setIsLoading(false);
            setStreamingContent('');
            setActiveTelemetry(null);

            // Confetti if search completed
            if (msg.telemetry && msg.telemetry.decision === 'search') {
              confetti({
                particleCount: 28,
                spread: 45,
                origin: { y: 0.9 },
                colors: ['#10b981', '#34d399', '#6ee7b7']
              });
            }
          },
          onError: (err) => {
            console.error('Pipeline error:', err);
            setIsLoading(false);
          }
        }
      );
    } catch (err: any) {
      console.error('Fatal execution error:', err);
      setIsLoading(false);
    }
  };

  // Inspect Source Handler
  const handleSourceClick = (url: string, title?: string) => {
    // Find matching source across recent messages
    let found: SearchSource | null = null;
    for (const m of messages) {
      if (m.telemetry?.sources) {
        const match = m.telemetry.sources.find((s) => s.url === url);
        if (match) {
          found = match;
          break;
        }
      }
    }

    if (found) {
      setPreviewSource(found);
    } else {
      // Create ad-hoc preview
      try {
        const domain = new URL(url).hostname;
        setPreviewSource({
          id: `preview-${Date.now()}`,
          title: title || domain,
          url,
          domain,
          snippet: `External reference from verified grounding: ${url}`,
          publishedDate: 'Verified Citation'
        });
      } catch {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat();
      }
      if (e.key === 'Escape') {
        setIsSystemPromptOpen(false);
        setIsSettingsOpen(false);
        setPreviewSource(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-main font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setStreamingContent('');
          setActiveTelemetry(null);
        }}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onTogglePinSession={handleTogglePinSession}
        onRenameSession={handleRenameSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSystemPrompt={() => setIsSystemPromptOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden lg:pl-72 sm:lg:pl-80 transition-all">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewChat}
          activeTitle={activeSession?.title || 'f0 custom ai'}
          settings={settings}
          onToggleSearchMode={(mode) => setSettings({ ...settings, searchMode: mode })}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSystemPrompt={() => setIsSystemPromptOpen(true)}
          onExportMarkdown={handleExportMarkdown}
        />

        {/* Scrollable Conversation Stream */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col">
          {messages.length === 0 && !isLoading ? (
            <div className="my-auto">
              <EmptyState
                onSelectPrompt={handleSendMessage}
                onOpenSystemPrompt={() => setIsSystemPromptOpen(true)}
              />
            </div>
          ) : (
            <div className="w-full max-w-3xl mx-auto space-y-2 pb-6">
              {messages.map((msg) => (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  onSourceClick={handleSourceClick}
                  onRegenerate={
                    msg.role === 'assistant'
                      ? () => {
                          const lastUser = [...messages]
                            .reverse()
                            .find((m) => m.role === 'user');
                          if (lastUser) handleSendMessage(lastUser.content);
                        }
                      : undefined
                  }
                />
              ))}

              {/* Live Streaming Response Card */}
              {isLoading && (
                <div className="py-2 animate-fade-in">
                  {streamingContent ? (
                    <ChatMessageItem
                      message={{
                        id: 'streaming-msg',
                        role: 'assistant',
                        content: streamingContent,
                        timestamp: Date.now(),
                        telemetry: activeTelemetry?.decision === 'search' ? activeTelemetry : undefined
                      }}
                      onSourceClick={handleSourceClick}
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 text-xs text-[#b4b4b4] py-3 px-1">
                      <span className="w-2 h-2 rounded-full bg-[#10a37f] animate-ping" />
                      <span>{activeTelemetry?.decision === 'search' ? 'Searching the web...' : 'Thinking...'}</span>
                    </div>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Bottom Chat Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          searchMode={settings.searchMode}
          onToggleSearchMode={(mode) => setSettings({ ...settings, searchMode: mode })}
        />
      </div>

      {/* Modals */}
      {isSystemPromptOpen && (
        <SystemPromptModal
          currentPrompt={settings.systemPrompt}
          onSavePrompt={(newP) => setSettings({ ...settings, systemPrompt: newP })}
          onClose={() => setIsSystemPromptOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSaveSettings={(newS) => setSettings(newS)}
          onClearHistory={handleClearHistory}
          onExportHistory={handleExportHistory}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {previewSource && (
        <SourcePreviewModal
          source={previewSource}
          onClose={() => setPreviewSource(null)}
        />
      )}
    </div>
  );
}
export default App;
