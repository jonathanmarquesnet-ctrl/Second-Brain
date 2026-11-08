'use client';

import { useState, type ReactNode } from 'react';
import { Check, Copy, Code2 } from 'lucide-react';

interface CodeBlockViewProps {
  code: string;
  language: string;
}

const TS_KEYWORDS = new Set([
  'export',
  'interface',
  'function',
  'const',
  'let',
  'return',
  'type',
  'async',
  'await',
  'if',
  'else',
  'for',
  'number',
  'string',
  'boolean',
]);

function highlightLine(line: string): ReactNode {
  if (line.trim().startsWith('//')) {
    return <span className="text-[#6B7280] italic">{line}</span>;
  }
  const tokens = line.split(/(\b[a-zA-Z_]\w*\b|'[^']*'|"[^"]*")/g);
  return tokens.map((token, idx) => {
    if (TS_KEYWORDS.has(token)) {
      return (
        <span key={idx} className="font-semibold text-[#60A5FA]">
          {token}
        </span>
      );
    }
    if ((token.startsWith("'") && token.endsWith("'")) || (token.startsWith('"') && token.endsWith('"'))) {
      return (
        <span key={idx} className="text-[#34D399]">
          {token}
        </span>
      );
    }
    return <span key={idx}>{token}</span>;
  });
}

export function CodeBlockView({ code, language }: CodeBlockViewProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-[#1F1F1F] bg-black/50 px-3.5 py-1.5">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#A3A3A3]">
          <Code2 className="h-3 w-3 text-[#2563EB]" />
          {language || 'typescript'}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="flex items-center gap-1 rounded-md border border-[#1F1F1F] bg-[#0A0A0A] px-2 py-0.5 text-[10px] text-[#A3A3A3] transition-colors hover:border-[#2563EB] hover:text-white"
          aria-label="Copiar código"
        >
          {copied ? <Check className="h-3 w-3 text-[#34D399]" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <div className="max-h-[158px] overflow-x-auto overflow-y-auto bg-black/40 px-3 py-2 scrollbar-thin">
        <pre className="font-mono text-[11px] leading-snug text-white">
          <code>
            {lines.map((line, i) => (
              <div key={i} className="table-row hover:bg-[#1F1F1F]/30">
                <span className="table-cell select-none pr-3 text-right font-mono text-[10px] text-[#52525B]">
                  {i + 1}
                </span>
                <span className="table-cell whitespace-pre pr-4">{highlightLine(line)}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
