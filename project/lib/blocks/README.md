# lib/blocks

Block type definitions, ordering operations, and mock data.

## Purpose
Owns the data shape of every block shown in the mosaic, plus the pure
functions that create, reorder, and remove blocks. No React here — this
module is framework-agnostic and fully unit-tested.

## Files
- `types.ts` — discriminated union `Block` covering intro, critic, code,
  slides, and chart.
- `operations.ts` — `reorderBlocks`, `removeBlock`, `createId` (pure).
- `mock-data.ts` — `createMockBlocks(prompt)` returns five mock blocks;
  `resolveLoading` flips a block's `loading` flag off.

## Inputs / Outputs
- `createMockBlocks(prompt: string): Block[]`
- `reorderBlocks(blocks, fromIndex, toIndex): Block[]`
- `removeBlock(blocks, id): Block[]`

## Dependencies
None beyond TypeScript.
