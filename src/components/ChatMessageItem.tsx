import React, { useState } from 'react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Sparkles
} from 'lucide-react';
import type { ChatMessage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ChatGPTSearchBadge } from './ChatGPTSearchBadge';

interface ChatMessageItemProps {
  message: ChatMessage;
  onSourceClick: (url: string, title?: string) => void;
  onRegenerate?: () => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onSourceClick,
  onRegenerate
}) => {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = message.content
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[*#`_]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-4">
        <div className="group relative max-w-[85%] sm:max-w-[70%] rounded-3xl bg-[#2f2f2f] px-5 py-3 text-[#ececec] text-sm sm:text-base leading-relaxed break-words shadow-sm">
          <div>{message.content}</div>
          <button
            type="button"
            onClick={handleCopy}
            className="absolute -left-8 top-3 p-1 rounded text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  // Assistant message (ChatGPT style)
  return (
    <div className="group py-3 sm:py-4 my-2 text-sm sm:text-base leading-relaxed">
      {/* ChatGPT Avatar Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-[#10a37f] flex items-center justify-center text-black font-bold text-xs shrink-0 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-semibold text-xs text-[#ececec]">ChatGPT</span>
      </div>

      {/* ChatGPT Search Pill (only if web search was executed) */}
      {message.telemetry && message.telemetry.decision === 'search' && (
        <ChatGPTSearchBadge telemetry={message.telemetry} onSourceClick={onSourceClick} />
      )}

      {/* Assistant Markdown Content */}
      <div className="text-[#ececec] pl-0 sm:pl-1">
        <MarkdownRenderer content={message.content} onSourceClick={onSourceClick} />
      </div>

      {/* ChatGPT Action Bar */}
      <div className="flex items-center gap-1.5 mt-3 pt-1 text-[#b4b4b4] opacity-80 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-[#2f2f2f] hover:text-white transition-colors"
          title="Copy"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={handleSpeak}
          className="p-1.5 rounded-lg hover:bg-[#2f2f2f] hover:text-white transition-colors"
          title={speaking ? 'Stop speaking' : 'Read aloud'}
        >
          {speaking ? <VolumeX className="w-4 h-4 text-[#10a37f]" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
          className={`p-1.5 rounded-lg hover:bg-[#2f2f2f] transition-colors ${
            feedback === 'up' ? 'text-emerald-400' : 'hover:text-white'
          }`}
          title="Good response"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
          className={`p-1.5 rounded-lg hover:bg-[#2f2f2f] transition-colors ${
            feedback === 'down' ? 'text-red-400' : 'hover:text-white'
          }`}
          title="Bad response"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>

        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            className="p-1.5 rounded-lg hover:bg-[#2f2f2f] hover:text-white transition-colors"
            title="Regenerate response"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
