# Lilt

A little room for endless music.

Lilt is a standalone procedural music generator extracted from The City Remembers.
It composes and synthesizes original lute duets locally. No game runtime, sample
libraries, accounts, or remote generation services are needed.

## Development

Use Node 22.18+ and npm. Install with `npm ci`.

- `npm test` — deterministic composition, rendering, playback, storage, MIDI, and media tests.
- `npm run typecheck` — application and test types.
- `npm run lint` — code, React, accessibility, and independence checks.
- `npm run format` / `npm run format:check` — formatting.

## Ownership

`src/audio` owns composition, arrangement, synthesis, effects, playback, settings,
library/history, cover art, MIDI export, and system-media integration. Cover art
accepts colors from its host; it does not depend on a theme implementation.
See [audio architecture](src/audio/ARCHITECTURE.md).

This is an independent source extraction, not a linked workspace. The original
game retains its music; changes in either repository do not propagate to the other.
Lilt uses its own local-storage namespace and media metadata. Previous game data
is neither read nor migrated.

## Provenance

The audio implementation and its 227 baseline tests originated in
`the-city-remembers/packages/game-client/src/audio`. Composition and DSP behavior
are preserved. Product metadata, browser storage keys, and cover-art color inputs
are the integration changes made during extraction.
