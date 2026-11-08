import type { BlockType } from '@/lib/blocks/types';

export interface NoteBlock {
  id: string;
  type: BlockType;
  content: string;
}

export interface Note {
  id: string;
  title: string;
  question: string;
  blocks: NoteBlock[];
  createdAt: string;
  updatedAt: string;
}
