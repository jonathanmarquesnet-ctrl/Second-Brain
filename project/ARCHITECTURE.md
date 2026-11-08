# Architecture

## Map

```
app/                    layout + page (client-side only)
  layout.tsx            root layout, ThemeProvider, fonts
  page.tsx              home: Shell + BlockMosaic + DebugPanel
components/
  theme-provider.tsx    next-themes wrapper (dark default)
  layout/               shell, sidebar, query bar, empty state
  blocks/               one file per block type + sortable wrapper + header + skeleton + mosaic
  debug/                DebugPanel (collapsible AI provider status)
store/
  blocks-store.ts       zustand: blocks array, submit, move, delete, loading
  providers-store.ts    zustand: simulated provider statuses for the debug panel
lib/
  ai/                   types + model-tiers config (no implementation in Phase 1)
  blocks/               types, pure operations, mock data (unit-tested)
  storage/              empty (Phase 2)
  sync/                 empty (Phase 6)
scripts/
  bundle-module.mjs     concatenates a folder into one .txt for Claude
public/
  manifest.webmanifest  PWA manifest
  sw.js                 basic service worker (shell cache only)
  _headers              Cloudflare security headers (COOP/COEP commented in Phase 1)
docs/
  prompts/              ready-made Claude prompts
```

## Data flow (Phase 1)
1. User types in the **QueryBar** and submits.
2. `useBlocksStore.submitPrompt(prompt)` calls `createMockBlocks(prompt)` from
   `lib/blocks/mock-data`, generating five mock `Block` objects (intro, critic,
   code, slides, chart) with `loading: true`.
3. Each block's `loading` flag flips to `false` after a short simulated timer.
4. **BlockMosaic** renders the blocks inside a dnd-kit `DndContext` with
   `SortableContext`. Dragging a block calls `moveBlock(from, to)`, which
   applies `reorderBlocks` (pure function from `lib/blocks/operations`).
5. **DebugPanel** reads `useProvidersStore` and shows simulated statuses. The
   "Simulate activity" button cycles providers through status sequences.

## Module responsibilities
| Module | Owns | Depends on |
|---|---|---|
| `lib/blocks` | Block type union, reorder/remove/create, mock data | — |
| `lib/ai` | AIProvider interface, model tier config | — |
| `store/blocks-store` | Block mosaic state + loading timers | lib/blocks |
| `store/providers-store` | Simulated provider statuses | lib/ai |
| `components/layout` | App shell, sidebar, query bar | store/blocks-store |
| `components/blocks` | All block UI + dnd-kit wiring | store/blocks-store, lib/blocks |
| `components/debug` | Debug panel | store/providers-store, lib/ai |

## Design system
The visual system is documented in `docs/DESIGN.md`. It defines the black,
white, neutral gray and `#2563EB` token palette, responsive layout, logo usage,
and state styling rules.

## Constraints enforced
- Static export (`output: 'export'`) — no API routes, no SSR, no middleware.
- No network calls except loading the app's own static assets.
- No API keys or secrets.
- ~150 lines max per file.
