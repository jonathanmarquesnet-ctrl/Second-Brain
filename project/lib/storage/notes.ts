import localforage from 'localforage';
import type { Note } from './types';

const memoryFallback = new Map<string, Note>();
let notesStoreInstance: LocalForage | null = null;

function getNotesStore(): LocalForage | null {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return null;
  if (!notesStoreInstance) {
    notesStoreInstance = localforage.createInstance({ name: 'second-brain', storeName: 'notes' });
  }
  return notesStoreInstance;
}

export async function saveNote(note: Note): Promise<void> {
  memoryFallback.set(note.id, note);
  const store = getNotesStore();
  if (!store) return;
  try {
    await store.setItem(note.id, note);
  } catch {}
}

export async function listNotes(): Promise<Note[]> {
  const store = getNotesStore();
  if (!store) {
    return [...memoryFallback.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  const notes: Note[] = [];
  try {
    await store.iterate((note: Note | null) => {
      if (note) notes.push(note);
    });
  } catch {
    return [...memoryFallback.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getNote(id: string): Promise<Note | null> {
  const store = getNotesStore();
  if (!store) return memoryFallback.get(id) ?? null;
  try {
    return (await store.getItem<Note>(id)) ?? memoryFallback.get(id) ?? null;
  } catch {
    return memoryFallback.get(id) ?? null;
  }
}

export async function deleteNote(id: string): Promise<void> {
  memoryFallback.delete(id);
  const store = getNotesStore();
  if (!store) return;
  try {
    await store.removeItem(id);
  } catch {}
}
