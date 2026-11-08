'use client';

import { useState, memo, type KeyboardEvent } from 'react';
import { ArrowUp, Square } from 'lucide-react';

interface ChatComposerProps {
  streaming: boolean;
  hasContext: boolean;
  includeContext: boolean;
  onToggleContext: (value: boolean) => void;
  onSend: (text: string) => void;
  onStop: () => void;
}

export const ChatComposer = memo(function ChatComposer({
  streaming,
  hasContext,
  includeContext,
  onToggleContext,
  onSend,
  onStop,
}: ChatComposerProps) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !streaming;

  function submit(): void {
    if (!canSend) return;
    const payload = text;
    setText('');
    onSend(payload);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="space-y-2 border-t border-[#1F1F1F] bg-[#0A0A0A] p-3 md:p-4">
      <div className="flex items-end gap-2 rounded-xl border border-[#1F1F1F] bg-black p-2 transition-all focus-within:border-[#2563EB] focus-within:shadow-[0_0_18px_rgba(37,99,235,0.22)]">
        <textarea
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte algo ao Claude..."
          aria-label="Mensagem para o Claude"
          className="max-h-40 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-white outline-none placeholder:text-[#8A8A8A]"
        />
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Parar resposta"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1F1F1F] text-white transition-colors hover:bg-[#1F1F1F]"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Enviar mensagem"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white transition-all hover:bg-[#1D4ED8] hover:shadow-[0_0_14px_rgba(37,99,235,0.4)] disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
      <label className="flex items-center gap-2 text-xs text-[#A3A3A3]">
        <input
          type="checkbox"
          checked={includeContext && hasContext}
          disabled={!hasContext}
          onChange={(event) => onToggleContext(event.target.checked)}
          className="accent-[#2563EB]"
        />
        {hasContext
          ? 'Incluir a nota aberta como contexto'
          : 'Abra uma nota para usá-la como contexto'}
      </label>
    </div>
  );
});
