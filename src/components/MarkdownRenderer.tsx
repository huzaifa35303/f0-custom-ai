import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Globe } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onSourceClick?: (url: string, title?: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onSourceClick }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderFormattedText = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(text)) !== null) {
      const start = match.index;
      const end = linkRegex.lastIndex;

      if (start > lastIndex) {
        parts.push(renderInlineFormatting(text.substring(lastIndex, start)));
      }

      const label = match[1];
      const url = match[2];

      parts.push(
        <button
          key={`link-${start}-${url}`}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (onSourceClick) {
              onSourceClick(url, label);
            } else {
              window.open(url, '_blank', 'noopener,noreferrer');
            }
          }}
          title={`Source: ${label}\nURL: ${url}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md text-xs font-medium bg-[#2f2f2f] hover:bg-[#383838] text-[#ececec] hover:text-white border border-white/10 transition-colors align-baseline"
        >
          <Globe className="w-2.5 h-2.5 text-[#10a37f]" />
          <span className="truncate max-w-[150px]">{label}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-50" />
        </button>
      );

      lastIndex = end;
    }

    if (lastIndex < text.length) {
      parts.push(renderInlineFormatting(text.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : renderInlineFormatting(text);
  };

  const renderInlineFormatting = (text: string): React.ReactNode => {
    // Bold **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(renderCodeAndItalics(text.substring(lastIdx, match.index)));
      }
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-white">
          {renderCodeAndItalics(match[1])}
        </strong>
      );
      lastIdx = boldRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(renderCodeAndItalics(text.substring(lastIdx)));
    }

    return parts.length > 0 ? parts : text;
  };

  const renderCodeAndItalics = (text: string): React.ReactNode => {
    const codeRegex = /`([^`]+)`/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = codeRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }
      parts.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-white/10 text-emerald-300 font-mono text-xs"
        >
          {match[1]}
        </code>
      );
      lastIdx = codeRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLanguage = '';
  let codeBlockCounter = 0;

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];
  let tableCounter = 0;

  const flushTable = () => {
    if (inTable && tableHeader.length > 0) {
      const currentIdx = tableCounter++;
      elements.push(
        <div key={`table-wrapper-${currentIdx}`} className="my-3 overflow-x-auto rounded-xl border border-[#3e3e3e] bg-[#212121]">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#3e3e3e] bg-[#2a2a2a]">
                {tableHeader.map((h, hIdx) => (
                  <th key={`th-${hIdx}`} className="px-3.5 py-2.5 font-semibold text-[#ececec] text-xs">
                    {renderFormattedText(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2f2f2f]">
              {tableRows.map((row, rIdx) => (
                <tr key={`tr-${rIdx}`} className="hover:bg-[#282828] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={`td-${rIdx}-${cIdx}`} className="px-3.5 py-2 text-[#b4b4b4]">
                      {renderFormattedText(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      flushTable();
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.substring(3).trim();
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        const currentIdx = codeBlockCounter++;
        const fullCode = codeBuffer.join('\n');
        elements.push(
          <div key={`code-block-${currentIdx}`} className="my-3 rounded-xl overflow-hidden border border-[#3e3e3e] bg-[#171717]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#262626] border-b border-[#3e3e3e] text-xs font-mono text-[#b4b4b4]">
              <span className="text-[#ececec] font-medium">{codeLanguage || 'code'}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(fullCode, currentIdx)}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                {copiedIndex === currentIdx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono text-[#ececec] leading-relaxed">
              <code>{fullCode}</code>
            </pre>
          </div>
        );
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').slice(1, -1);
      const isSeparator = cells.every(c => /^[\s\-:]+$/.test(c));

      if (isSeparator) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
        tableRows = [];
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl sm:text-2xl font-bold text-white mt-4 mb-2 tracking-tight">
          {renderFormattedText(line.substring(2))}
        </h1>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg sm:text-xl font-semibold text-white mt-4 mb-2">
          {renderFormattedText(line.substring(3))}
        </h2>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm sm:text-base font-semibold text-white mt-3 mb-1.5">
          {renderFormattedText(line.substring(4))}
        </h3>
      );
      continue;
    }

    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${i}`} className="text-xs sm:text-sm font-semibold text-[#b4b4b4] mt-2 mb-1 uppercase tracking-wider">
          {renderFormattedText(line.substring(5))}
        </h4>
      );
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2.5 my-1 pl-1 text-sm leading-relaxed text-[#ececec]">
          <span className="text-[#8e8e8e] font-bold mt-0.5">•</span>
          <div className="flex-1">{renderFormattedText(line.substring(2))}</div>
        </div>
      );
      continue;
    }

    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2.5 my-1 pl-1 text-sm leading-relaxed text-[#ececec]">
          <span className="text-xs font-semibold text-[#8e8e8e] mt-0.5 w-4">{numMatch[1]}.</span>
          <div className="flex-1">{renderFormattedText(numMatch[2])}</div>
        </div>
      );
      continue;
    }

    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-2 border-[#10a37f] pl-3.5 my-2.5 text-xs sm:text-sm italic text-[#b4b4b4] bg-[#2a2a2a]/40 py-1 rounded-r">
          {renderFormattedText(line.substring(2))}
        </blockquote>
      );
      continue;
    }

    if (!line.trim()) {
      elements.push(<div key={`blank-${i}`} className="h-2" />);
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="my-1.5 text-sm sm:text-base leading-relaxed text-[#ececec]">
        {renderFormattedText(line)}
      </p>
    );
  }

  flushTable();

  return <div className="space-y-0.5 text-[#ececec]">{elements}</div>;
};
