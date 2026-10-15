import React from 'react';
import {
  PanelLeftClose,
  PanelLeft,
  SquarePen,
  ChevronDown,
  Sliders,
  Terminal,
  Download,
  Sparkles
} from 'lucide-react';
import type { AppSettings, SearchModeType } from '../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  activeTitle: string;
  settings: AppSettings;
  onToggleSearchMode: (mode: SearchModeType) => void;
  onOpenSettings: () => void;
  onOpenSystemPrompt: () => void;
  onExportMarkdown: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onNewChat,
  activeTitle,
  settings,
  onOpenSettings,
  onOpenSystemPrompt,
  onExportMarkdown
}) => {
  return (
    <header className="sticky top-0 z-30 w-full h-14 bg-[#212121] flex items-center justify-between px-3 sm:px-4 border-b border-transparent">
      {/* Left: Sidebar toggle + Model Selector */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#2f2f2f] transition-colors"
          title="Toggle sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        {/* ChatGPT Model Selector Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#2f2f2f] text-[#ececec] font-semibold text-sm transition-colors"
        >
          <span>ChatGPT</span>
          <span className="text-xs text-[#b4b4b4] font-normal">
            {settings.provider === 'gemini' ? '3.8 Pro' : 'Search'}
          </span>
          <ChevronDown className="w-4 h-4 text-[#8e8e8e]" />
        </button>
      </div>

      {/* Center: Thread Title on Desktop */}
      <div className="hidden md:block max-w-sm truncate text-xs text-[#8e8e8e] font-medium">
        {activeTitle || 'New chat'}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onNewChat}
          className="p-2 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#2f2f2f] transition-colors"
          title="New chat"
        >
          <SquarePen className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onExportMarkdown}
          className="p-2 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#2f2f2f] transition-colors hidden sm:block"
          title="Export chat"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenSystemPrompt}
          className="p-2 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#2f2f2f] transition-colors"
          title="System prompt"
        >
          <Terminal className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#2f2f2f] transition-colors"
          title="Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
