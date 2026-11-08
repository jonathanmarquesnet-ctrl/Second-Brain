# Decisions

A record of decisions already made. Revisit before changing direction.

## Static site (Cloudflare Pages)
**Decision:** The app is a static export with zero server cost.
**Rationale:** Keeps hosting free and simple. All intelligence runs
client-side (local WebGPU) or via optional user-supplied keys (BYOK) /
asynchronous queues (AI Horde).

## BYOK (bring-your-own-key) is optional
**Decision:** Users may supply their own AI provider keys. The app works
fully without them.
**Rationale:** Avoids server-side key management and cost. Phase 3.

## AI Horde is asynchronous and optional
**Decision:** AI Horde integration is opt-in and asynchronous (queue-based).
**Rationale:** Horde is community-run and not always fast. Phase 5.

## Obsidian export via File System Access API
**Decision:** Export to Obsidian will use the File System Access API, not a
server endpoint.
**Rationale:** Keeps everything client-side; works on desktop browsers.

## Hermes model is optional and off on mobile
**Decision:** The Hermes model is `optional: true` and `defaultOnMobile: false`.
No model is ever downloaded without explicit user confirmation.
**Rationale:** Hermes is large; mobile data plans and device limits make
auto-download unacceptable.

## Local storage via IndexedDB (Phase 2)
**Decision:** Persistence uses IndexedDB (localForage or thin wrapper), not a
backend.
**Rationale:** Keeps the app offline-capable and server-free.

## Cloudflare Pages headers include COOP/COEP
**Decision:** `public/_headers` ships COOP/COEP active from Phase 1.
**Rationale:** Required later for SharedArrayBuffer (FFmpeg.wasm / WebGPU
threads). Safe to ship now since Phase 1 has no third-party scripts.

## Recharts for the chart block
**Decision:** Use Recharts for the mock chart block.
**Rationale:** Already a dependency in the template, works client-side, no
network calls.
