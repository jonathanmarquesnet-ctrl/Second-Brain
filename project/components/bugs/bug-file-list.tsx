'use client';

import type { BugFile } from '@/lib/bugs/file-system';

interface BugFileListProps {
  files: BugFile[];
  filter: string;
  selectedPath: string | undefined;
  onFilterChange: (value: string) => void;
  onSelect: (file: BugFile) => void;
}

export function BugFileList({ files, filter, selectedPath, onFilterChange, onSelect }: BugFileListProps) {
  return (
    <div className="space-y-2 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-3">
      <input
        type="search"
        value={filter}
        onChange={(event) => onFilterChange(event.target.value)}
        placeholder="Filtrar arquivos..."
        aria-label="Filtrar arquivos"
        className="w-full rounded-md border border-[#1F1F1F] bg-black px-2 py-1.5 text-xs text-white outline-none focus:border-[#2563EB]"
      />
      <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
        {files.map((file) => (
          <button
            key={file.path}
            type="button"
            onClick={() => onSelect(file)}
            className={`block w-full truncate rounded-md px-2 py-1.5 text-left text-xs ${selectedPath === file.path ? 'bg-[#2563EB]/15 text-white' : 'text-[#A3A3A3] hover:bg-black hover:text-white'}`}
          >
            {file.path}
          </button>
        ))}
        {files.length === 0 && <p className="px-2 py-1.5 text-xs text-[#A3A3A3]">Nenhum arquivo encontrado.</p>}
      </div>
    </div>
  );
}
