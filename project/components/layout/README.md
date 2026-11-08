# components/layout

Top-level app shell.

## Files
- `shell.tsx` — responsive layout wrapper: sidebar + header + main. Toggles
  sidebar on mobile.
- `sidebar.tsx` — branded navigation rail (static links in Phase 1).
- `query-bar.tsx` — top search input. On submit calls `submitPrompt` on the
  blocks store, which generates the mock mosaic.

## Dependencies
- store/blocks-store
