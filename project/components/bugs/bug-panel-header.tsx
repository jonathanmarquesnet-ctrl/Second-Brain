'use client';

interface BugPanelHeaderProps {
  error: string;
  notice: string;
  onOpenFolder: () => void;
}

export function BugPanelHeader({ error, notice, onOpenFolder }: BugPanelHeaderProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Caça-Bugs</h1>
          <p className="mt-1 text-sm text-[#A3A3A3]">Abra uma pasta local para revisar arquivos com segurança.</p>
        </div>
        <button type="button" onClick={onOpenFolder} className="rounded-md bg-[#2563EB] px-3 py-2 text-xs font-medium text-white">
          Abrir pasta do projeto
        </button>
      </div>
      {error && <div className="rounded-lg border border-[#7F1D1D] bg-[#450A0A] px-4 py-3 text-sm text-white">{error}</div>}
      {notice && <div className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-4 py-3 text-sm text-white">{notice}</div>}
    </>
  );
}
