import React, { useState } from 'react';
import {
  SquarePen,
  PanelLeftClose,
  MoreHorizontal,
  Trash2,
  Edit2,
  Check,
  X,
  Sliders,
  User,
  Sparkles
} from 'lucide-react';
import type { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onTogglePinSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  onOpenSystemPrompt: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onOpenSettings,
  isOpen,
  onClose
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const startRename = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
    setMenuOpenId(null);
  };

  const confirmRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#171717] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="h-14 px-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onNewChat}
            className="p-2 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors"
            title="New chat"
          >
            <SquarePen className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          <div className="px-2 pt-2 pb-1 text-[11px] font-semibold text-[#737373]">
            Recent
          </div>

          {sessions.length === 0 ? (
            <div className="px-3 py-4 text-xs text-[#737373]">
              No chats yet.
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = activeSessionId === s.id;
              const isEditing = editingId === s.id;

              if (isEditing) {
                return (
                  <form
                    key={s.id}
                    onSubmit={(e) => confirmRename(s.id, e)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#212121]"
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-transparent text-xs text-white outline-none"
                      autoFocus
                    />
                    <button type="submit" className="p-1 text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 text-slate-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                );
              }

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSession(s.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                    isActive
                      ? 'bg-[#212121] text-white font-medium'
                      : 'text-[#ececec] hover:bg-[#212121]'
                  }`}
                >
                  <span className="truncate pr-6 text-xs sm:text-sm">
                    {s.title || 'New chat'}
                  </span>

                  {/* 3-dots Menu Button */}
                  <div className="absolute right-1.5 flex items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === s.id ? null : s.id);
                      }}
                      className="p-1 rounded text-[#8e8e8e] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {menuOpenId === s.id && (
                      <div className="absolute right-0 top-6 z-50 w-32 rounded-xl bg-[#212121] border border-white/10 shadow-2xl p-1 text-xs">
                        <button
                          type="button"
                          onClick={(e) => startRename(s, e)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#2f2f2f]"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Rename</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(s.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-[#2f2f2f]"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#212121] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold text-xs">
                H
              </div>
              <div className="text-left">
                <div className="text-xs font-medium text-white">Huzaifa</div>
                <div className="text-[10px] text-[#737373]">Free plan</div>
              </div>
            </div>
            <Sliders className="w-4 h-4 text-[#8e8e8e]" />
          </button>
        </div>
      </aside>
    </>
  );
};
