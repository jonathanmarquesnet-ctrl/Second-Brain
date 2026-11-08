# lib/storage

**Phase 2 module — intentionally empty.**

## Purpose (planned)
Persist blocks and user preferences locally in the browser using IndexedDB
(via localForage or a thin wrapper). No network calls.

## Status
No code in Phase 1. Block order lives only in memory (zustand) and resets on
reload. Implement in Phase 2.

## Dependencies (planned)
- IndexedDB / localForage
