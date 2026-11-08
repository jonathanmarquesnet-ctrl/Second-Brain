import type { Block } from './types';

export function removeBlock(blocks: Block[], id: string): Block[] {
  return blocks.filter((b) => b.id !== id);
}

export function reorderBlocks(
  blocks: Block[],
  fromIndex: number,
  toIndex: number,
): Block[] {
  if (
    fromIndex < 0 ||
    fromIndex >= blocks.length ||
    toIndex < 0 ||
    toIndex >= blocks.length ||
    fromIndex === toIndex
  ) {
    return blocks;
  }
  const next = [...blocks];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
