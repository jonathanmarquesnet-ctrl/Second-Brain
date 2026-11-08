'use client';

import { useEffect, useRef, useState, memo, type FormEvent } from 'react';
import { ArrowUp, Sparkles, Zap } from 'lucide-react';
import { useBlocksStore } from '@/store/blocks-store';
import { useProvidersStore } from '@/store/providers-store';

export const QueryBar = memo(function QueryBar() {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const submitPrompt = useBlocksStore((s) => s.submitPrompt);
  const isRefining = useBlocksStore((s) => s.isRefining);
  const lastSubmitLatencyMs = useProvidersStore((s) => s.lastSubmitLatencyMs);
  const initBackgroundPreWarming = useProvidersStore((s) => s.initBackgroundPreWarming);

  useEffect(() => {
    initBackgroundPreWarming();
    function handleKeyDown(e: KeyboardEvent): void {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [initBackgroundPreWarming]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue('');
    submitPrompt(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-1.5">
      <div className="group flex min-w-0 w-full items-center gap-1.5 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] px-2.5 py-1.5 transition-all duration-150 focus-within:border-[#2563EB] focus-within:bg-black focus-within:shadow-[0_0_24px_rgba(37,99,235,0.28)]">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Pergunte algo..."
          className="min-w-0 flex-1 bg-transparent py-1 text-xs text-white outline-none placeholder:text-[#A3A3A3]"
          aria-label="Pergunte algo"
        />
        {!value && (
          <kbd className="hidden shrink-0 rounded border border-[#1F1F1F] bg-black px-1.5 py-0.5 font-mono text-[10px] text-[#A3A3A3] sm:inline-block">
            Ctrl+K
          </kbd>
        )}
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="Enviar pergunta"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white transition-all hover:bg-[#1D4ED8] hover:shadow-[0_0_14px_rgba(37,99,235,0.45)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between whitespace-nowrap px-1 text-[10px] text-[#A3A3A3]">
        <span className="inline-flex items-center gap-1">
          <Zap className="h-2.5 w-2.5 text-[#34D399]" />
          <span>Resposta instantânea</span>
        </span>
        <span className="font-mono font-semibold text-[#60A5FA]">
          {isRefining ? `${lastSubmitLatencyMs}ms • Ativo` : `${lastSubmitLatencyMs}ms`}
        </span>
      </div>
    </form>
  );
});
