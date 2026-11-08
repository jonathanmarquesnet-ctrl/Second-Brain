import { describe, it, expect } from 'vitest';
import { reorderBlocks, removeBlock, createId } from './operations';
import { createMockBlocks, resolveLoading } from './mock-data';
import type { Block } from './types';

function sampleBlocks(): Block[] {
  return createMockBlocks('test prompt');
}

describe('reorderBlocks', () => {
  it('moves a block from one index to another', () => {
    const blocks = sampleBlocks();
    const moved = reorderBlocks(blocks, 0, 2);
    expect(moved[2].type).toBe('intro');
    expect(moved).toHaveLength(blocks.length);
  });

  it('returns the same array reference-equivalent content on no-op', () => {
    const blocks = sampleBlocks();
    const result = reorderBlocks(blocks, 1, 1);
    expect(result).toEqual(blocks);
  });

  it('clamps on out-of-range indices', () => {
    const blocks = sampleBlocks();
    expect(reorderBlocks(blocks, -1, 0)).toEqual(blocks);
    expect(reorderBlocks(blocks, 0, 99)).toEqual(blocks);
  });
});

describe('removeBlock', () => {
  it('removes the block with the given id', () => {
    const blocks = sampleBlocks();
    const target = blocks[1].id;
    const result = removeBlock(blocks, target);
    expect(result).toHaveLength(blocks.length - 1);
    expect(result.find((b) => b.id === target)).toBeUndefined();
  });

  it('returns the same array when id is not found', () => {
    const blocks = sampleBlocks();
    expect(removeBlock(blocks, 'nonexistent')).toEqual(blocks);
  });
});

describe('createId', () => {
  it('produces unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createId()));
    expect(ids.size).toBe(50);
  });
});

describe('resolveLoading', () => {
  it('sets loading=false for the matching block only', () => {
    const blocks = sampleBlocks();
    const target = blocks[0].id;
    const result = resolveLoading(blocks, target);
    expect(result[0].loading).toBe(false);
    expect(result[1].loading).toBe(true);
  });
});
