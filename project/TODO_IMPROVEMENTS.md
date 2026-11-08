# Future Improvements

Per-module backlog. Not in scope for Phase 1.

## lib/blocks
- Add more block types (table, embed, equation).
- Support nested blocks (children inside blocks).
- Block-level persistence hooks (deferred to Phase 2).

## lib/ai
- Phase 3: BYOK provider implementations (OpenAI, Anthropic, Google).
- Phase 4: local WebGPU provider (transformers.js / web-llm).
- Phase 5: AI Horde async provider.
- Streaming UI integration with `AIChunk` events.
- Model download progress + explicit consent flow.

## store
- Persist block order to IndexedDB (Phase 2).
- Undo/redo for block moves and deletions.
- Multi-selection drag.

## components/layout
- Sidebar navigation wiring (spaces, recent notes).
- Command palette (cmdk is already a dependency).
- Collapsible sidebar persistence.

## components/blocks
- Block edit mode (inline editing of mock content).
- Resize handles for chart/slides blocks.
- Copy-to-clipboard for any block.
- Better touch drag affordance.

## components/debug
- Wire to real provider statuses once implementations exist.
- Per-provider detail view (logs, model size, queue position).
- Toggle individual providers on/off.

## PWA
- Real icons (192/512) generated for the manifest.
- Offline fallback page.
- Update-available notification.

## Docs
- Per-phase changelog.
- Onboarding guide for new contributors.
