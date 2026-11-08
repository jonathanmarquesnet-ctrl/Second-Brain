# store

Zustand stores for client-side state.

## Files
- `blocks-store.ts` — holds the block mosaic, exposes `submitPrompt`,
  `moveBlock`, `deleteBlock`, and `clearBlockLoading`.
- `providers-store.ts` — debug-only store of AI provider statuses with a
  `simulate()` action that cycles through status states for demo purposes.

## Dependencies
- zustand
- lib/blocks (types, operations, mock-data)
- lib/ai (ProviderStatus type)
