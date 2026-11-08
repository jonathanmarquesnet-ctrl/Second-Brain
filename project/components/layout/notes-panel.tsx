'use client';

import { useEffect, useState } from 'react';
import type { Note } from '@/lib/storage/types';
import { listNotes } from '@/lib/storage/notes';

export function NotesPanel({ onOpen }: { onOpen: (note: Note) => void }) {
  const [notes, setNotes] = useState<Note[]>([]);
  useEffect(() => { void listNotes().then(setNotes); }, []);
  return <div className="mt-2 max-h-[calc(100vh-230px)] space-y-1 overflow-y-auto pl-3">{notes.length ? notes.map((note) => <button key={note.id} type="button" onClick={() => onOpen(note)} className="block w-full truncate rounded-md px-2 py-1.5 text-left text-xs text-[#A3A3A3] hover:bg-[#0A0A0A] hover:text-white">{note.title}</button>) : <p className="px-2 text-xs text-[#A3A3A3]">Nenhuma nota salva.</p>}</div>;
}
