# CLAUDE_CONTEXT

Paste this at the start of conversations with Claude (free tier) to give it the
context it needs.

---

## Product
"Produto X" — a modular "Second Brain" app (Notion-style) that runs 100%
client-side and deploys as a static site on Cloudflare Pages (zero server cost).

## Phase
Phase 1 of 7: static shell + modular UI + documented base. No real AI, no
storage, no sync, no network calls.

## Hard constraints
- 100% client-side. Static export (`output: 'export'`). No API routes, server
  actions, middleware, or dynamic SSR.
- Zero server cost. Hosted on Cloudflare Pages.
- No API keys or secrets in Phase 1.
- TypeScript strict mode. No `any`.
- ~150 lines max per file. One responsibility per file.
- BYOK (bring-your-own-key) and AI Horde are **optional** and come in later
  phases. Never assume they exist.
- Hermes model is **optional** and **off by default on mobile**. Never
  download any model without explicit user confirmation.
- Dark mode is the default.
- Mobile-first responsive design.

## Visual identity
Follow `docs/DESIGN.md`: use only black, white, neutral grays, and `#2563EB`.
Use `/public/logo.png` with screen blending on dark surfaces. Do not introduce
other hues in cards, debug states, charts, or interactions.

## Code conventions
- Each module folder in `/lib` and `/components` has a `README.md`.
- Modules communicate through explicit TypeScript interfaces.
- Comments only where logic is non-obvious.
- No unnecessary dependencies.

## Module map (see ARCHITECTURE.md for detail)
- `lib/blocks` — block types, pure ordering ops, mock data (tested)
- `lib/ai` — AIProvider interface, model tier config (no implementation yet)
- `store/` — zustand stores (blocks, providers)
- `components/layout` — shell, sidebar, query bar
- `components/blocks` — block UI + dnd-kit
- `components/debug` — AI provider debug panel

## When responding
- Provide complete, paste-ready files.
- Respect the file-size and responsibility constraints.
- Reference ARCHITECTURE.md for placement decisions.
