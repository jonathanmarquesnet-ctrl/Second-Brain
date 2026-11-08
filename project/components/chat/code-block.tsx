'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

const TOKEN = /(\/\/.*$|\b(?:const|let|var|function|return|if|else|import|from|export|default|async|await|class|interface|type|new|for|while|try|catch|throw)\b|'[^'\n]*'|"[^"\n]*")/gm;

function highlight(code: string): React.ReactNode[] {
  return code.split(TOKEN).map((part, index) => {
    if (index % 2 === 0) return part;
    const color = part.startsWith('//') ? 'text-[#6B7280]' : part.startsWith("'") || part.startsWith('"') ? 'text-[#86EFAC]' : 'text-[#7DD3FC]';
    return <span key={index} className={color}>{part}</span>;
  });
}

export function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-[#1F1F1F] bg-[#050505]">
      <div className="flex items-center justify-between border-b border-[#1F1F1F] px-3 py-1.5 text-xs text-[#A3A3A3]">
        <span>{language || 'texto'}</span>
        <button type="button" onClick={() => void copy()} className="flex items-center gap-1.5 transition-colors hover:text-white">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-5 text-[#E5E5E5]"><code>{highlight(code)}</code></pre>
    </div>
  );
}
