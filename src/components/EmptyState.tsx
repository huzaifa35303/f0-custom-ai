import React from 'react';
import {
  Globe,
  Code2,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  HelpCircle
} from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  onOpenSystemPrompt: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectPrompt
}) => {
  const SUGGESTIONS = [
    {
      icon: <Globe className="w-4 h-4 text-sky-400" />,
      title: 'Latest Google DeepMind AI releases',
      prompt: 'What are the latest AI model releases and capabilities from Google DeepMind as of today?'
    },
    {
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      title: 'Compare Rust vs Go performance',
      prompt: 'Compare Rust vs Go memory management and high-throughput latency in a table.'
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-amber-400" />,
      title: 'Bitcoin & crypto market update',
      prompt: 'What is the current Bitcoin market price and institutional ETF trend as of October 2026?'
    },
    {
      icon: <BrainCircuit className="w-4 h-4 text-purple-400" />,
      title: 'Derive Backpropagation equations',
      prompt: 'Derive the mathematical formula of Backpropagation using multivariable calculus.'
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-16 flex flex-col items-center text-center my-auto">
      {/* ChatGPT Greeting */}
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#ececec] mb-8">
        What can I help with?
      </h1>

      {/* 2x2 Suggestion Grid like ChatGPT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
        {SUGGESTIONS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="p-3.5 rounded-2xl bg-[#2f2f2f] hover:bg-[#383838] border border-white/[0.05] transition-all flex items-center gap-3 group text-left"
          >
            <div className="p-2 rounded-xl bg-[#212121] group-hover:scale-105 transition-transform shrink-0">
              {item.icon}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-[#ececec] group-hover:text-white truncate">
                {item.title}
              </div>
              <div className="text-xs text-[#737373] truncate">
                Click to ask
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
