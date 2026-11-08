# components/blocks

One file per block type, plus the sortable wrapper and shared header/skeleton.

## Files
- `sortable-block.tsx` — wraps a block in a dnd-kit sortable container, renders
  the header, and dispatches to the correct view when loading completes.
- `block-header.tsx` — title, drag handle, remove button.
- `block-skeleton.tsx` — loading placeholder.
- `intro-block.tsx`, `critic-block.tsx`, `code-block.tsx`, `slides-block.tsx`,
  `chart-block.tsx` — the five block views.

## Dependencies
- @dnd-kit/sortable, @dnd-kit/utilities
- recharts (chart block)
- lucide-react (icons)
- store/blocks-store
