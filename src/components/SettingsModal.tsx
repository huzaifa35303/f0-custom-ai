import React, { useState } from 'react';
import {
  X,
  Key,
  Sliders,
  Trash2,
  Download,
  Check,
  ExternalLink
} from 'lucide-react';
import type { AppSettings, SearchModeType } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClearHistory: () => void;
  onExportHistory: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClearHistory,
  onExportHistory,
  onClose
}) => {
  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSaveSettings(form);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#212121] border border-[#3e3e3e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2f2f2f]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#10a37f]" />
            <h3 className="text-sm font-semibold text-[#ececec]">Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-white hover:bg-[#2f2f2f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm text-[#ececec]">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#b4b4b4] uppercase tracking-wider block">
              AI Engine & Model
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, provider: 'builtin' })}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  form.provider === 'builtin'
                    ? 'border-[#10a37f] bg-[#10a37f]/10 text-white'
                    : 'border-[#383838] bg-[#2a2a2a] text-[#b4b4b4] hover:bg-[#333]'
                }`}
              >
                <div className="font-semibold text-xs text-white">ChatGPT Search</div>
                <div className="text-[11px] text-[#10a37f] font-medium mt-1">100% Free · No API Key Needed</div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, provider: 'gemini' })}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  form.provider === 'gemini'
                    ? 'border-[#10a37f] bg-[#10a37f]/10 text-white'
                    : 'border-[#383838] bg-[#2a2a2a] text-[#b4b4b4] hover:bg-[#333]'
                }`}
              >
                <div className="font-semibold text-xs text-white">Gemini 3.8 / 2.5</div>
                <div className="text-[11px] text-[#8e8e8e] mt-1">Google Search Grounding API</div>
              </button>
            </div>
          </div>

          {/* Gemini API Key if selected */}
          {form.provider === 'gemini' && (
            <div className="p-3.5 rounded-xl bg-[#2a2a2a] border border-[#3e3e3e] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#10a37f]" />
                  <span>Google AI API Key</span>
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#10a37f] hover:underline flex items-center gap-1"
                >
                  <span>Get API Key</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <input
                type="password"
                value={form.apiKey || ''}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded-lg bg-[#212121] border border-[#3e3e3e] text-xs font-mono text-white outline-none focus:border-[#10a37f]"
              />
            </div>
          )}

          {/* Search Mode Default */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#b4b4b4] uppercase tracking-wider block">
              Default Search Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['smart', 'force_search', 'direct_only'] as SearchModeType[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setForm({ ...form, searchMode: mode })}
                  className={`p-2.5 rounded-xl border text-center text-xs transition-colors ${
                    form.searchMode === mode
                      ? 'border-[#10a37f] bg-[#10a37f]/10 text-white font-medium'
                      : 'border-[#383838] bg-[#2a2a2a] text-[#b4b4b4] hover:bg-[#333]'
                  }`}
                >
                  {mode === 'smart' ? 'Auto Search' : mode === 'force_search' ? 'Always Search' : 'No Search'}
                </button>
              ))}
            </div>
          </div>

          {/* Data Management */}
          <div className="pt-3 border-t border-[#2f2f2f] space-y-2">
            <label className="text-xs font-semibold text-[#b4b4b4] uppercase tracking-wider block">
              Data & Conversations
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportHistory}
                className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#2f2f2f] hover:bg-[#383838] text-xs text-[#ececec] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Data</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all conversation history?')) {
                    onClearHistory();
                  }
                }}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2f2f2f] bg-[#1a1a1a] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs text-[#b4b4b4] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[#10a37f] hover:bg-[#1a7f64] text-white transition-all shadow-sm"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
