import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Globe,
  FileText,
  Sparkles,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import type { SearchTelemetry, SearchActivityStep } from '../types';

interface SearchProcessCardProps {
  telemetry: SearchTelemetry;
  onSourceClick?: (url: string, title?: string) => void;
}

export const SearchProcessCard: React.FC<SearchProcessCardProps> = ({ telemetry, onSourceClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStepIcon = (type: SearchActivityStep['type']) => {
    switch (type) {
      case 'intent':
        return <HelpCircle className="w-3.5 h-3.5 text-sky-400" />;
      case 'query':
        return <Search className="w-3.5 h-3.5 text-amber-400" />;
      case 'search':
        return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
      case 'fetch':
        return <FileText className="w-3.5 h-3.5 text-purple-400" />;
      case 'verify':
        return <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />;
      case 'synthesis':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const isDirect = telemetry.decision === 'direct';

  return (
    <div className="mb-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/[0.03] transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium">
            <span className={`w-2 h-2 rounded-full ${isDirect ? 'bg-sky-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span className={isDirect ? 'text-sky-300' : 'text-emerald-300 font-semibold'}>
              {isDirect ? 'Direct Knowledge Mode' : 'Search-Augmented Pipeline'}
            </span>
          </div>

          <span className="text-white/20 text-xs">•</span>

          <span className="text-xs text-slate-400 font-mono">
            {isDirect
              ? 'Stable facts verified'
              : `${telemetry.queries.length} queries • ${telemetry.sources.length} sources • ${telemetry.fetchedPages.length} pages read`}
          </span>

          {telemetry.timeTakenMs > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 font-mono">
              {(telemetry.timeTakenMs / 1000).toFixed(2)}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
          <span>{isOpen ? 'Hide reasoning' : 'View process'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Details */}
      {isOpen && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-white/[0.06] space-y-3 text-xs">
          {/* Query Intent Statement */}
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-slate-300 flex items-start gap-2">
            <div className="p-1 rounded bg-sky-500/10 text-sky-400 mt-0.5">
              <HelpCircle className="w-3 h-3" />
            </div>
            <div>
              <div className="font-medium text-slate-200">Decision Rationale</div>
              <div className="text-slate-400 mt-0.5">{telemetry.reason}</div>
            </div>
          </div>

          {/* Search Queries Executed */}
          {telemetry.queries.length > 0 && (
            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3 h-3 text-amber-400" />
                <span>Short & Specific Queries Executed (2-6 words)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {telemetry.queries.map((q, idx) => (
                  <div
                    key={`q-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-200/90 font-mono text-[11px]"
                  >
                    <span className="text-amber-400/60 font-semibold">{idx + 1}.</span>
                    <span>"{q.query}"</span>
                    <span className="text-white/30 text-[10px]">({q.purpose})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sequential Process Steps */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
              Execution Telemetry Trail
            </div>
            <div className="space-y-1.5 pl-1">
              {telemetry.steps.map((st) => (
                <div key={st.id} className="flex items-start gap-2 text-slate-300">
                  <div className="mt-0.5">{getStepIcon(st.type)}</div>
                  <div className="flex-1">
                    <span className="font-medium text-slate-200">{st.title}: </span>
                    <span className="text-slate-400">{st.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fetched Primary Documents */}
          {telemetry.fetchedPages.length > 0 && (
            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-purple-400" />
                <span>Primary Document Full Content Fetched (Page-Fetch Tool)</span>
              </div>
              <div className="space-y-1">
                {telemetry.fetchedPages.map((page, idx) => (
                  <div
                    key={`fp-${idx}`}
                    className="flex items-center justify-between p-2 rounded bg-purple-500/5 border border-purple-500/15 text-[11px]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span className="text-slate-200 font-medium truncate">{page.title}</span>
                      <span className="text-slate-500 font-mono text-[10px]">({page.length} chars)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSourceClick?.(page.url, page.title)}
                      className="text-purple-300 hover:text-purple-200 font-mono flex items-center gap-1 shrink-0 ml-2"
                    >
                      <span>inspect</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
