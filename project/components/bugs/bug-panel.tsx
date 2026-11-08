'use client';

import { useEffect, useState } from 'react';
import { getAiSettings, modelsForProvider, type AiSettings } from '@/lib/ai/config';
import type { ProviderName } from '@/lib/ai/providers/types';
import { BugFileList } from '@/components/bugs/bug-file-list';
import { BugPanelHeader } from '@/components/bugs/bug-panel-header';
import { BugViewer } from '@/components/bugs/bug-viewer';
import { BugEditor } from '@/components/bugs/bug-editor';
import { useBugWorkspace } from '@/hooks/use-bug-workspace';
import { canPickDirectory, type BugFile } from '@/lib/bugs/file-system';
import { askBug, buildReviewPrompt, keyFor, parseReview, reviewErrorMessage, type BugReview } from '@/lib/bugs/review';

type BugMode = 'review' | 'edit';

const MODE_TABS: { value: BugMode; label: string }[] = [
  { value: 'review', label: 'Revisar' },
  { value: 'edit', label: 'Editar' },
];

export function BugPanel() {
  const workspace = useBugWorkspace();
  const { selected, original, busy, error, notice, setBusy, setError } = workspace;
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [mode, setMode] = useState<BugMode>('review');
  const [provider, setProvider] = useState<ProviderName>('gemini');
  const [model, setModel] = useState('');
  const [review, setReview] = useState<BugReview | null>(null);

  useEffect(() => {
    getAiSettings()
      .then((value) => {
        setSettings(value);
        setProvider(value.routes.code.provider);
        setModel(value.routes.code.model);
      })
      .catch(() => setError('Não foi possível carregar as configurações.'));
  }, [setError]);

  const models = settings ? modelsForProvider(provider, settings) : [];
  const hasBug = review !== null && review.linhas_com_erro.length > 0 && review.codigo_corrigido !== original;
  const choice = { provider, model, models, onProviderChange: setProvider, onModelChange: setModel };

  function choose(file: BugFile): void {
    setReview(null);
    void workspace.chooseFile(file);
  }

  async function reviewFile(): Promise<void> {
    if (!selected || !settings || !model) return;
    if (!keyFor(settings, provider)) {
      setError('Adicione sua chave em Configurações');
      return;
    }
    setBusy(true);
    setError('');
    setReview(null);
    try {
      setReview(parseReview(await askBug(settings, provider, model, buildReviewPrompt(selected.path, original))));
    } catch (reason) {
      setError(reviewErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function applySuggestion(): Promise<void> {
    if (!review || !hasBug) return;
    if (await workspace.applyContent(review.codigo_corrigido, model)) setReview(null);
  }

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <BugPanelHeader error={error} notice={notice} onOpenFolder={() => void workspace.openFolder()} />

      {workspace.root && (
        <div className="grid min-h-0 gap-4 md:grid-cols-[240px_1fr]">
          <BugFileList files={workspace.visibleFiles} filter={workspace.filter} selectedPath={selected?.path} onFilterChange={workspace.setFilter} onSelect={choose} />

          <div className="min-w-0 space-y-4">
            <div role="tablist" className="flex gap-1">
              {MODE_TABS.map((tab) => (
                <button key={tab.value} type="button" role="tab" aria-selected={mode === tab.value} onClick={() => setMode(tab.value)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${mode === tab.value ? 'bg-[#2563EB]/15 text-white' : 'text-[#A3A3A3] hover:bg-black hover:text-white'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {mode === 'review' ? (
              <BugViewer
                selected={selected}
                ready={settings !== null}
                tooLarge={workspace.tooLarge}
                original={original}
                review={review}
                busy={busy}
                choice={choice}
                onReview={() => void reviewFile()}
                onApply={() => void applySuggestion()}
              />
            ) : (
              <BugEditor
                selected={selected}
                original={original}
                settings={settings}
                choice={choice}
                busy={busy}
                onError={setError}
                applyContent={workspace.applyContent}
                undoLast={workspace.undoLast}
              />
            )}
          </div>
        </div>
      )}

      {!workspace.root && !canPickDirectory() && <p className="text-xs text-[#A3A3A3]">Disponível apenas no Chrome/Edge, em aba própria</p>}
    </section>
  );
}
