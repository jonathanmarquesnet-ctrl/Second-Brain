'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Bug, FileText, FolderOpen, MessageSquare, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Note } from '@/lib/storage/types';
import { QueryBar } from './query-bar';
import { NotesPanel } from './notes-panel';
import { SettingsPanel } from './settings-panel';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
  onNewSearch?: () => void;
  onOpenNote: (note: Note) => void;
  onOpenBugs?: () => void;
  chatOpen?: boolean;
  onToggleChat?: () => void;
}

const NAV_ITEMS = [
  { id: 'search', icon: Search, label: 'Nova busca', isSearch: true },
  { id: 'notes', icon: FileText, label: 'Notas recentes', isNotes: true },
  { id: 'chat', icon: MessageSquare, label: 'Chat Claude', isChat: true },
  { id: 'spaces', icon: FolderOpen, label: 'Espaços' },
  { id: 'bugs', icon: Bug, label: 'Caça-Bugs', isBugs: true },
];

export function Sidebar({ className, onClose, onNewSearch, onOpenNote, onOpenBugs, chatOpen, onToggleChat }: SidebarProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  function handleClick(item: typeof NAV_ITEMS[number]): void {
    if (item.isSearch) {
      onNewSearch?.();
      setNotesOpen(false);
      onClose?.();
    } else if (item.isNotes) {
      setNotesOpen((open) => !open);
    } else if (item.isChat) {
      onToggleChat?.();
      onClose?.();
    } else if (item.isBugs) {
      onOpenBugs?.();
      onClose?.();
    }
  }

  return (
    <aside className={cn('relative flex h-screen flex-col overflow-hidden border-r border-[#1F1F1F] bg-black text-white', className)}>
      <div className="shrink-0 flex items-center gap-3 px-5 py-5">
        <Image src="/logo.png" alt="Produto X" width={32} height={32} className="logo-screen object-contain" priority />
        <span className="text-lg font-semibold tracking-tight">Second Brain</span>
      </div>

      <nav className="min-h-0 flex-1 overflow-hidden px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = (item.isChat && chatOpen) || (item.isSearch && !chatOpen);
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => handleClick(item)}
                className={cn(
                  'mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-[#2563EB]/15 text-white' : 'text-[#A3A3A3] hover:bg-[#0A0A0A] hover:text-white',
                )}
              >
                <Icon className={cn('h-4 w-4', isActive && 'text-[#2563EB]')} />
                {item.label}
              </button>
              {item.isNotes && notesOpen && <NotesPanel onOpen={onOpenNote} />}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-4 border-t border-[#1F1F1F] px-4 py-4">
        <button
          type="button"
          onClick={() => setSettingsOpen((open) => !open)}
          className="flex w-full items-center gap-3 px-2 text-sm text-[#A3A3A3] transition-colors hover:text-white"
        >
          <Settings className="h-4 w-4" />
          Configurações
        </button>
        <QueryBar />
      </div>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </aside>
  );
}
