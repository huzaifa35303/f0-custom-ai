import React, { useState } from 'react';
import { Globe, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { SearchTelemetry } from '../types';

interface ChatGPTSearchBadgeProps {
  telemetry: SearchTelemetry;
  onSourceClick?: (url: string, title?: string) => void;
}

export const ChatGPTSearchBadge: React.FC<ChatGPTSearchBadgeProps> = ({
  telemetry,
  onSourceClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (telemetry.decision !== 'search' || !telemetry.sources || telemetry.sources.length === 0) {
    return null;
  }

  const sourcesCount = telemetry.sources.length;

  return (
    <div className="mb-3 inline-block w-full max-w-full">
      {/* ChatGPT-style Search Pill */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#2f2f2f] hover:bg-[#383838] text-[#ececec] border border-white/[0.08] transition-colors group"
        >
          <Globe className="w-3.5 h-3.5 text-[#10a37f] group-hover:rotate-12 transition-transform" />
          <span>Searched {sourcesCount} sites</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-white/50" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-white/50" />
          )}
        </button>

        {/* Quick favicon chips on collapsed view */}
        {!isExpanded && (
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-1">
            {telemetry.sources.slice(0, 4).map((src, i) => (
              <button
                key={src.id || i}
                type="button"
                onClick={() => onSourceClick?.(src.url, src.title)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[#2a2a2a] hover:bg-[#333] text-[#b4b4b4] hover:text-white border border-white/[0.05] transition-colors truncate max-w-[160px]"
                title={src.title}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]" />
                <span className="truncate">{src.domain.replace('www.', '')}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Sources Row */}
      {isExpanded && (
        <div className="mt-2.5 p-3 rounded-2xl bg-[#282828] border border-white/[0.08] animate-fade-in">
          <div className="text-[11px] font-medium text-[#b4b4b4] mb-2 px-1 flex items-center justify-between">
            <span>Sources</span>
            <span className="text-[#737373]">{sourcesCount} results reviewed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {telemetry.sources.map((src, idx) => (
              <a
                key={src.id || idx}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (onSourceClick) {
                    e.preventDefault();
                    onSourceClick(src.url, src.title);
                  }
                }}
                className="group flex items-start gap-2.5 p-2.5 rounded-xl bg-[#212121] hover:bg-[#2f2f2f] border border-white/[0.05] hover:border-white/10 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-[#2f2f2f] group-hover:bg-[#383838] flex items-center justify-center shrink-0 mt-0.5 text-xs text-[#b4b4b4]">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-[#ececec] group-hover:text-white truncate">
                    {src.title}
                  </div>
                  <div className="text-[11px] text-[#737373] truncate flex items-center gap-1 mt-0.5">
                    <span>{src.domain.replace('www.', '')}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
