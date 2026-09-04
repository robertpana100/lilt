# Lilt

Lilt is a standalone procedural music generator extracted from The City Remembers.
It composes and synthesizes original lute duets locally. No game runtime, sample
libraries, accounts, or remote generation services are needed.

## Development

Use Node 22.18+ and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5174. `npm run build` produces `dist/` and
`npm run preview` serves that build at http://127.0.0.1:4174.
Playback starts when you press Play; the first visit is quiet. Browser preferences
and the library stay on that origin, so development and preview have separate data.

The UI uses React 19, shadcn/ui (Base UI), Tailwind CSS 4, and Vite. UI components
are vendored in `src/components/ui`; the slider also forwards its accessible name
to the actual thumb. The independent app shell owns artwork colors, media artwork,
visible notifications, and the responsive studio layout.

- `npm test` — deterministic composition, rendering, playback, storage, MIDI, and media tests.
- `npm run typecheck` — application and test types.
- `npm run lint` — code, React, accessibility, and independence checks.
- `npm run format` / `npm run format:check` — formatting.

## Studio

The player, composition controls, instruments, effects, and library share one
scrolling view. Choose **Manual** or **Enable manual controls** to edit the score,
mix, harmony, rhythm, and effects. Automatic and favourite playback keep those
controls visible but disabled. The player stays visible while scrolling on desktop.

**Recent** and **Favourites** appear together and share a search field. The library
keeps the latest 25 played takes and up to 100 favourites. MIDI downloads contain
note data. Session controls reset on reload; favouriting a played take preserves
its replay recipe.

The header offers **Light**, **Dark**, and **System** appearance. The choice persists
locally, follows OS changes in System mode, and updates both the interface and
cover art without restarting playback.

## Ownership

`src/audio` owns composition, arrangement, synthesis, effects, playback, settings,
library/history, cover art, MIDI export, and system-media integration. Cover art
accepts colors from its host; it does not depend on a theme implementation.
See [audio architecture](src/audio/ARCHITECTURE.md) and
[extraction boundaries and verification](docs/extraction.md).

This is an independent source extraction, not a linked workspace. The original
game retains its music; changes in either repository do not propagate to the other.
Lilt uses its own local-storage namespace and media metadata. Previous game data
is neither read nor migrated.

## Provenance

The audio implementation and its 227 baseline tests originated in
`the-city-remembers/packages/game-client/src/audio`. Composition and DSP behavior
are preserved. Product metadata, browser storage keys, and cover-art color inputs
are the integration changes made during extraction.
