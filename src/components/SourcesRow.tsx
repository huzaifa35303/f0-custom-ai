import React from 'react';
import { Globe, ExternalLink, Calendar } from 'lucide-react';
import type { SearchSource } from '../types';

interface SourcesRowProps {
  sources: SearchSource[];
  onSourceClick: (url: string, title?: string) => void;
}

export const SourcesRow: React.FC<SourcesRowProps> = ({ sources, onSourceClick }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mb-3.5">
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-2 uppercase tracking-wider">
        <Globe className="w-3 h-3 text-emerald-400" />
        <span>Grounded Primary Sources ({sources.length})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {sources.map((src, index) => {
          return (
            <div
              key={src.id || index}
              onClick={() => onSourceClick(src.url, src.title)}
              className="group p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400/90 truncate font-medium">
                      {src.domain}
                    </span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                </div>

                <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                  {src.title}
                </h4>

                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {src.snippet}
                </p>
              </div>

              {src.publishedDate && (
                <div className="mt-2 pt-1.5 border-t border-white/[0.04] flex items-center gap-1 text-[10px] font-mono text-slate-500">
                  <Calendar className="w-2.5 h-2.5 text-slate-500" />
                  <span>{src.publishedDate}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
