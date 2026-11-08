# Produto X — Second Brain

A modular, Notion-style "second brain" app. 100% client-side, hostable as a
static site on Cloudflare Pages at zero server cost.

This is **Phase 1 of 7**: the static shell. It ships the UI, block mosaic,
drag-and-drop, debug panel, documentation, and tests — but no real AI,
storage, or sync.

## Stack
- Next.js (App Router) with `output: 'export'` — static site
- TypeScript (strict, no `any`)
- Tailwind CSS + shadcn/ui
- @dnd-kit (drag-and-drop, touch support)
- next-themes (dark mode by default)
- zustand (state)
- Vitest (tests), Recharts (charts)

## Install & run
```bash
npm install
npm run dev
```
Open the printed URL. Dark mode is on by default.

## Scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Static export to `out/` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (run once) |
| `npm run test:watch` | Vitest (watch) |
| `npm run typecheck` | tsc --noEmit |
| `npm run bundle:module -- <folder>` | Concatenate a folder into one `.txt` for pasting into Claude |

## Tests
```bash
npm test
```
Covers block operations (reorder, remove, create) and model-tier config
(Hermes optional and off on mobile).

## Deploy to Cloudflare Pages
1. `npm run build` — produces `out/` directory.
2. Cloudflare dashboard → Pages → Create project → connect repo (or drag `out/`).
3. Build command: `npm run build`. Output directory: `out`.
4. `public/_headers` is copied into the build automatically and applies
   security headers (CSP, COOP/COEP, etc.) on Cloudflare.

## What this phase does NOT include
Real AI, IndexedDB storage, sync, Notion/Obsidian export, AI Horde, FFmpeg.
See `DECISIONS.md` and `TODO_IMPROVEMENTS.md`.

## Documentation
- `ARCHITECTURE.md` — project map and data flow
- `CLAUDE_CONTEXT.md` — paste at the start of Claude conversations
- `DECISIONS.md` — decisions already made
- `TODO_IMPROVEMENTS.md` — future improvements per module
- `docs/prompts/` — ready-made prompts for Claude
