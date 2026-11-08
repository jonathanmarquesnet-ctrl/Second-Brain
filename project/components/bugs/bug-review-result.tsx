'use client';

import DiffViewer from 'react-diff-viewer-continued';

interface BugReviewResultProps {
  original: string;
  proposed: string;
  summary: string;
  highlightLines: number[];
  hasChange: boolean;
  busy: boolean;
  applyLabel: string;
  emptyMessage: string;
  onApply: () => void;
}

export function BugReviewResult({ original, proposed, summary, highlightLines, hasChange, busy, applyLabel, emptyMessage, onApply }: BugReviewResultProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]">
      {hasChange ? (
        <DiffViewer
          oldValue={original}
          newValue={proposed}
          splitView
          useDarkTheme
          disableWordDiff
          highlightLines={highlightLines.map((line) => `R${line}`)}
          styles={{ variables: { dark: { diffViewerBackground: '#0A0A0A', addedBackground: '#12351F', removedBackground: '#3A1717', addedColor: '#D1FAE5', removedColor: '#FECACA' } } }}
        />
      ) : (
        <p className="p-4 text-sm text-white">{emptyMessage}</p>
      )}
      <div className="border-t border-[#1F1F1F] p-4">
        {summary && <p className="text-sm leading-6 text-[#A3A3A3]">{summary}</p>}
        <button type="button" disabled={busy || !hasChange} onClick={onApply} className="mt-3 rounded-md bg-[#2563EB] px-3 py-2 text-xs font-medium text-white disabled:opacity-40">
          {applyLabel}
        </button>
      </div>
    </div>
  );
}
