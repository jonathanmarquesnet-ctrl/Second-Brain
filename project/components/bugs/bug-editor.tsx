'use client';

import { useState } from 'react';
import { BugModelPicker, type ModelChoice } from '@/components/bugs/bug-model-picker';
import { BugReviewResult } from '@/components/bugs/bug-review-result';
import type { AiSettings } from '@/lib/ai/config';
import type { BugFile } from '@/lib/bugs/file-system';
import { askBug, buildEditPrompt, keyFor, parseEdit, reviewErrorMessage } from '@/lib/bugs/review';

type EditSource = 'paste' | 'ask';
interface Proposal { code: string; summary: string; }

const SOURCES: { value: EditSource; label: string }[] = [
  { value: 'paste', label: 'Colar arquivo' },
  { value: 'ask', label: 'Pedir alteração' },
];

interface BugEditorProps {
  selected: BugFile | null;
  original: string;
  settings: AiSettings | null;
  choice: ModelChoice;
  busy: boolean;
  onError: (message: string) => void;
  applyContent: (content: string, model: string) => Promise<boolean>;
  undoLast: () => Promise<void>;
}

export function BugEditor({ selected, original, settings, choice, busy, onError, applyContent, undoLast }: BugEditorProps) {
  const [source, setSource] = useState<EditSource>('paste');
  const [pasted, setPasted] = useState('');
  const [instruction, setInstruction] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [asking, setAsking] = useState(false);

  if (!selected) return null;

  const hasChange = proposal !== null && proposal.code.trim() !== '' && proposal.code !== original;
  const disabled = busy || asking;

  function switchSource(next: EditSource): void {
    setSource(next);
    setProposal(null);
  }

  async function askAi(): Promise<void> {
    if (!selected || !settings) return;
    if (!keyFor(settings, choice.provider)) {
      onError('Adicione sua chave em Configurações');
      return;
    }
    setAsking(true);
    setProposal(null);
    onError('');
    try {
      const edit = parseEdit(await askBug(settings, choice.provider, choice.model, buildEditPrompt(selected.path, original, instruction)));
      setProposal({ code: edit.codigo_novo, summary: edit.resumo });
    } catch (reason) {
      onError(reviewErrorMessage(reason));
    } finally {
      setAsking(false);
    }
  }

  async function apply(): Promise<void> {
    if (!proposal) return;
    if (await applyContent(proposal.code, choice.model)) {
      setProposal(null);
      setPasted('');
      setInstruction('');
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-3">
        <div role="tablist" className="flex gap-1">
          {SOURCES.map((item) => (
            <button key={item.value} type="button" role="tab" aria-selected={source === item.value} onClick={() => switchSource(item.value)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${source === item.value ? 'bg-[#2563EB]/15 text-white' : 'text-[#A3A3A3] hover:bg-black hover:text-white'}`}>
              {item.label}
            </button>
          ))}
        </div>

        {source === 'paste' ? (
          <>
            <textarea value={pasted} onChange={(event) => setPasted(event.target.value)} rows={12} placeholder="Cole aqui o conteúdo completo do arquivo..." className="w-full rounded-md border border-[#1F1F1F] bg-black p-2 font-mono text-xs text-white outline-none focus:border-[#2563EB]" />
            <button type="button" disabled={disabled || !pasted.trim()} onClick={() => setProposal({ code: pasted, summary: '' })} className="rounded-md bg-[#2563EB] px-3 py-2 text-xs font-medium text-white disabled:opacity-40">
              Ver diferenças
            </button>
          </>
        ) : (
          <>
            <label className="block text-xs text-[#A3A3A3]">
              O que você quer mudar?
              <input type="text" value={instruction} onChange={(event) => setInstruction(event.target.value)} className="mt-1 w-full rounded-md border border-[#1F1F1F] bg-black px-2 py-2 text-xs text-white outline-none focus:border-[#2563EB]" />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              {settings && <BugModelPicker {...choice} />}
              <button type="button" disabled={disabled || !instruction.trim() || !settings} onClick={() => void askAi()} className="rounded-md bg-[#2563EB] px-3 py-2 text-xs font-medium text-white disabled:opacity-40">
                {asking ? 'Pensando...' : 'Pedir alteração'}
              </button>
            </div>
          </>
        )}
      </div>

      {proposal && (
        <BugReviewResult
          original={original}
          proposed={proposal.code}
          summary={proposal.summary}
          highlightLines={[]}
          hasChange={hasChange}
          busy={disabled}
          applyLabel="Aplicar alteração"
          emptyMessage="Nenhuma diferença em relação ao arquivo atual."
          onApply={() => void apply()}
        />
      )}

      <button type="button" disabled={disabled} onClick={() => void undoLast()} className="rounded-md border border-[#1F1F1F] bg-black px-3 py-2 text-xs font-medium text-white disabled:opacity-40">
        Desfazer última alteração
      </button>
    </div>
  );
}
