import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse blocks: code blocks, tables, lists, headers, and paragraphs
  const renderFormatted = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let codeLang = '';
    let tableBuffer: string[] = [];
    let inTable = false;
    let blockIndex = 0;

    const flushTable = () => {
      if (tableBuffer.length === 0) return;
      const rows = tableBuffer.map(row => 
        row.split('|').slice(1, -1).map(cell => cell.trim())
      );
      
      const header = rows[0];
      const dataRows = rows.slice(2); // Skip separator row

      elements.push(
        <div key={`table-${blockIndex++}`} className="my-4 overflow-x-auto rounded-xl border border-zinc-700/60 bg-zinc-900/60 shadow-inner">
          <table className="min-w-full divide-y divide-zinc-700/60 text-sm">
            <thead className="bg-zinc-800/50">
              <tr>
                {header?.map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left font-semibold text-zinc-200">
                    {parseInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {dataRows.map((r, ri) => (
                <tr key={ri} className="hover:bg-zinc-800/30 transition-colors">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-4 py-2.5 text-zinc-300 align-top">
                      {parseInline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = [];
      inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start / end
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          const fullCode = codeBuffer.join('\n');
          const currentIdx = blockIndex++;
          elements.push(
            <div key={`code-${currentIdx}`} className="relative my-3 rounded-xl overflow-hidden border border-zinc-800 bg-[#0d0d12] shadow-md group">
              <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900/80 border-b border-zinc-800/60 text-xs text-zinc-400 font-mono">
                <span>{codeLang || 'plaintext'}</span>
                <button
                  onClick={() => handleCopy(fullCode, currentIdx)}
                  className="flex items-center gap-1 hover:text-zinc-200 transition-colors py-0.5 px-1.5 rounded bg-zinc-800/60 hover:bg-zinc-700/60"
                >
                  {copiedIndex === currentIdx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono text-zinc-200 leading-relaxed">
                <code>{fullCode}</code>
              </pre>
            </div>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          flushTable();
          inCodeBlock = true;
          codeLang = line.trim().replace('```', '').trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Markdown table detection
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        tableBuffer.push(line);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Horizontal rule
      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={`hr-${blockIndex++}`} className="my-4 border-zinc-800" />);
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${blockIndex++}`} className="text-base sm:text-lg font-semibold text-zinc-100 mt-4 mb-2 tracking-tight">
            {parseInline(line.substring(4))}
          </h3>
        );
        continue;
      }
      if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={`h4-${blockIndex++}`} className="text-sm sm:text-base font-semibold text-purple-300 mt-3 mb-1.5">
            {parseInline(line.substring(5))}
          </h4>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${blockIndex++}`} className="text-lg sm:text-xl font-bold text-white mt-5 mb-2.5">
            {parseInline(line.substring(3))}
          </h2>
        );
        continue;
      }

      // Bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        const bulletText = line.trim().replace(/^[\*\-•]\s+/, '');
        elements.push(
          <li key={`li-${blockIndex++}`} className="ml-4 list-disc text-zinc-300 my-1 leading-relaxed">
            {parseInline(bulletText)}
          </li>
        );
        continue;
      }

      // Numbered lists
      if (/^\d+\.\s+/.test(line.trim())) {
        const match = line.trim().match(/^(\d+\.)\s+(.*)/);
        if (match) {
          elements.push(
            <div key={`num-${blockIndex++}`} className="flex gap-2 my-1.5 leading-relaxed text-zinc-300">
              <span className="font-semibold text-purple-400 min-w-[20px]">{match[1]}</span>
              <div>{parseInline(match[2])}</div>
            </div>
          );
          continue;
        }
      }

      // Blank line
      if (!line.trim()) {
        elements.push(<div key={`blank-${blockIndex++}`} className="h-2" />);
        continue;
      }

      // Standard paragraph
      elements.push(
        <p key={`p-${blockIndex++}`} className="text-zinc-300 my-1 leading-relaxed">
          {parseInline(line)}
        </p>
      );
    }

    if (inTable) flushTable();

    return elements;
  };

  // Inline markdown parser: **bold**, `code`, *italic*, [link](url), <br>
  const parseInline = (text: string): React.ReactNode => {
    // Process <br> tags
    const parts = text.split(/<br\s*\/?>/gi);
    return parts.map((part, pIdx) => {
      // Bold + code tokens
      const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
      const subTokens = part.split(regex);

      return (
        <React.Fragment key={pIdx}>
          {pIdx > 0 && <br />}
          {subTokens.map((token, tIdx) => {
            if (token.startsWith('**') && token.endsWith('**')) {
              return (
                <strong key={tIdx} className="font-semibold text-zinc-100">
                  {token.slice(2, -2)}
                </strong>
              );
            }
            if (token.startsWith('`') && token.endsWith('`')) {
              return (
                <code key={tIdx} className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-purple-300 font-mono text-[0.85em] border border-zinc-700/40">
                  {token.slice(1, -1)}
                </code>
              );
            }
            if (token.startsWith('*') && token.endsWith('*')) {
              return (
                <em key={tIdx} className="text-zinc-300 italic">
                  {token.slice(1, -1)}
                </em>
              );
            }
            return token;
          })}
        </React.Fragment>
      );
    });
  };

  return <div className="space-y-1 text-sm sm:text-base leading-relaxed">{renderFormatted()}</div>;
};
