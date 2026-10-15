import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Globe,
  Mic,
  MicOff,
  Plus
} from 'lucide-react';
import type { SearchModeType } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  searchMode: SearchModeType;
  onToggleSearchMode: (mode: SearchModeType) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  searchMode,
  onToggleSearchMode
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const isSearchActive = searchMode === 'force_search' || searchMode === 'smart';

  const toggleSearch = () => {
    if (searchMode === 'direct_only') {
      onToggleSearchMode('smart');
    } else if (searchMode === 'smart') {
      onToggleSearchMode('force_search');
    } else {
      onToggleSearchMode('direct_only');
    }
  };

  const hasText = input.trim().length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-3 pt-1">
      <div className="relative rounded-[26px] bg-[#2f2f2f] border border-[#3e3e3e] shadow-lg p-2.5 transition-all focus-within:border-[#555]">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatGPT..."
          rows={1}
          disabled={isLoading}
          className="w-full bg-transparent text-[#ececec] placeholder-[#8e8e8e] resize-none outline-none px-2.5 py-1 text-sm sm:text-base leading-relaxed max-h-[200px]"
        />

        {/* Bottom bar inside input */}
        <div className="flex items-center justify-between pt-1 px-1">
          {/* Left Buttons: Attach + Search */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="p-1.5 rounded-full text-[#b4b4b4] hover:text-white hover:bg-[#383838] transition-colors"
              title="Attach files"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Search Pill like SearchGPT */}
            <button
              type="button"
              onClick={toggleSearch}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                searchMode === 'force_search'
                  ? 'bg-[#1075e8] text-white shadow-sm'
                  : searchMode === 'smart'
                  ? 'bg-[#383838] text-[#ececec] hover:bg-[#424242]'
                  : 'bg-transparent text-[#8e8e8e] hover:text-[#b4b4b4]'
              }`}
              title="Toggle Web Search (SearchGPT)"
            >
              <Globe className={`w-3.5 h-3.5 ${searchMode === 'force_search' ? 'text-white' : 'text-[#10a37f]'}`} />
              <span>{searchMode === 'force_search' ? 'Search ON' : searchMode === 'smart' ? 'Search Auto' : 'Search OFF'}</span>
            </button>
          </div>

          {/* Right Buttons: Mic + Up Arrow Send */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-1.5 rounded-full transition-colors ${
                isListening
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'text-[#b4b4b4] hover:text-white hover:bg-[#383838]'
              }`}
              title="Voice dictation"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!hasText || isLoading}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                hasText && !isLoading
                  ? 'bg-white text-black hover:bg-[#f0f0f0] cursor-pointer'
                  : 'bg-[#424242] text-[#8e8e8e] cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-[#737373] mt-2">
        ChatGPT can make mistakes. Check important info.
      </div>
    </div>
  );
};
