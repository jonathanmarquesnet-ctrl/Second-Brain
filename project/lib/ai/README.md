# lib/ai

AI provider contracts — **types and configuration only** for Phase 1.

## Purpose
Defines the interfaces every AI provider must implement, plus the
configuration for local model tiers. No implementations ship here yet.

## Files
- `types.ts` — `AIProvider`, `AIRequest`, `AIChunk`, `ProviderStatus`, `ProviderKind`.
- `model-tiers.ts` — local model configs per device tier (mobile, desktop-basic,
  desktop-gpu, Hermes). All models are `optional: true`; Hermes and every model
  default to off on mobile. **No model is ever downloaded without explicit
  user confirmation.**

## When do implementations arrive?
- Phase 3 — BYOK providers (user-supplied API keys).
- Phase 4 — local WebGPU providers.
- Phase 5 — AI Horde (asynchronous, optional).

## Dependencies
None (pure TypeScript types and a static config array).
