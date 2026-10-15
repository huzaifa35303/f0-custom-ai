import React, { useState } from 'react';
import { X, Copy, Check, RotateCcw, Save, Terminal } from 'lucide-react';
import { DEFAULT_SYSTEM_PROMPT, formatSystemPrompt } from '../utils/systemPrompt';

interface SystemPromptModalProps {
  currentPrompt: string;
  onSavePrompt: (prompt: string) => void;
  onClose: () => void;
}

export const SystemPromptModal: React.FC<SystemPromptModalProps> = ({
  currentPrompt,
  onSavePrompt,
  onClose
}) => {
  const [promptText, setPromptText] = useState(currentPrompt);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatSystemPrompt(promptText));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setPromptText(DEFAULT_SYSTEM_PROMPT);
  };

  const handleSave = () => {
    onSavePrompt(promptText);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#212121] border border-[#3e3e3e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2f2f2f]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#10a37f]" />
            <h3 className="text-sm font-semibold text-[#ececec]">Custom Instructions & Guidelines</h3>
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
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8e8e8e]">
              Active instructions for chat & search behaviors
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-[#10a37f] hover:underline"
            >
              {isEditing ? 'Preview Mode' : 'Edit Prompt'}
            </button>
          </div>

          {isEditing ? (
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={14}
              className="w-full p-4 rounded-xl bg-[#171717] border border-[#3e3e3e] text-xs font-mono text-[#ececec] outline-none focus:border-[#10a37f] leading-relaxed resize-none"
            />
          ) : (
            <div className="p-4 rounded-xl bg-[#171717] border border-white/[0.05] font-mono text-xs text-[#b4b4b4] whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
              {formatSystemPrompt(promptText)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2f2f2f] bg-[#1a1a1a] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-[#8e8e8e] hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#2f2f2f] hover:bg-[#383838] text-[#ececec] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#10a37f] hover:bg-[#1a7f64] text-white transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs bg-[#2f2f2f] hover:bg-[#383838] text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
