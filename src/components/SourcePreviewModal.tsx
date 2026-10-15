import React from 'react';
import { X, ExternalLink, Globe, Copy, Check } from 'lucide-react';
import type { SearchSource } from '../types';

interface SourcePreviewModalProps {
  source: SearchSource | null;
  onClose: () => void;
}

export const SourcePreviewModal: React.FC<SourcePreviewModalProps> = ({ source, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!source) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(source.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#212121] border border-[#3e3e3e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2f2f2f]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#2f2f2f] flex items-center justify-center text-[#10a37f]">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-[#8e8e8e] block">
                {source.domain.replace('www.', '')}
              </span>
              <h3 className="text-sm font-semibold text-[#ececec] truncate max-w-sm">
                {source.title}
              </h3>
            </div>
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
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-[#b4b4b4] leading-relaxed">
          <div className="p-3 rounded-xl bg-[#2f2f2f] border border-white/[0.05] flex items-center justify-between gap-3">
            <div className="text-xs text-[#8e8e8e] truncate flex-1 font-mono">
              {source.url}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#383838] hover:bg-[#424242] text-xs text-[#ececec] transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10a37f] hover:bg-[#1a7f64] text-xs text-white font-medium transition-colors"
              >
                <span>Visit site</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-[#8e8e8e] uppercase tracking-wider mb-2">
              Extracted Page Content
            </div>
            <div className="p-4 rounded-xl bg-[#282828] border border-white/[0.05] text-xs sm:text-sm text-[#ececec] whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto font-mono">
              {source.fullText || source.snippet}
            </div>
          </div>

          {source.publishedDate && (
            <div className="text-xs text-[#737373]">
              Date: <span className="text-[#ececec]">{source.publishedDate}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2f2f2f] bg-[#1a1a1a] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs bg-[#2f2f2f] hover:bg-[#383838] text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
