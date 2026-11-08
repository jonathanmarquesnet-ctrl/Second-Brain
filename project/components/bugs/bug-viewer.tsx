'use client';

import { BugModelPicker, type ModelChoice } from '@/components/bugs/bug-model-picker';
import { BugReviewResult } from '@/components/bugs/bug-review-result';
import type { BugFile } from '@/lib/bugs/file-system';
import type { BugReview } from '@/lib/bugs/review';

const NO_BUG_MESSAGE = 'Nenhum bug encontrado neste arquivo.';

interface BugViewerProps {
  selected: BugFile | null;
  ready: boolean;
  tooLarge: boolean;
  original: string;
  review: BugReview | null;
  busy: boolean;
  choice: ModelChoice;
  onReview: () => void;
  onApply: () => void;
}

export function BugViewer({ selected, ready, tooLarge, original, review, busy, choice, onReview, onApply }: BugViewerProps) {
  const hasBug = review !== null && review.linhas_com_erro.length > 0 && review.codigo_corrigido !== original;
  return (
    <div className="min-w-0 space-y-4">
      {selected && ready && !tooLarge && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-3">
          <BugModelPicker {...choice} />
          <button type="button" disabled={busy} onClick={onReview} className="rounded-md bg-[#2563EB] px-3 py-2 text-xs font-medium text-white disabled:opacity-40">
            {busy ? 'Revisando...' : 'Revisar'}
          </button>
        </div>
      )}

      {tooLarge && <p className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-4 text-sm text-[#A3A3A3]">Arquivo muito grande para revisar.</p>}

      {review && (
        <BugReviewResult
          original={original}
          proposed={review.codigo_corrigido}
          summary={review.critica_explicativa}
          highlightLines={review.linhas_com_erro}
          hasChange={hasBug}
          busy={busy}
          applyLabel="Aplicar sugestão"
          emptyMessage={NO_BUG_MESSAGE}
          onApply={onApply}
        />
      )}

      {selected && !tooLarge && !review && (
        <pre className="max-h-[calc(100vh-300px)] overflow-auto rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-4 text-xs leading-5 text-[#A3A3A3]">{original}</pre>
      )}
    </div>
  );
}
