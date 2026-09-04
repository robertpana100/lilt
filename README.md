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
stay on that origin, so development and preview have separate settings.

The UI uses React 19, native HTML controls, plain CSS, and Vite. There is no
component library or CSS framework. The app shell owns the neutral light/dark
palette, cover-art colors, system-media artwork, and notifications.

- `npm test` — deterministic composition, rendering, playback, settings, and media tests.
- `npm run typecheck` — application and test types.
- `npm run lint` — code, React, accessibility, and independence checks.
- `npm run format` / `npm run format:check` — formatting.

## Studio

Automatic mode shows the player and direction selector. Choose **Manual** to
reveal atmosphere, tempo, variety, humanization, and effects. Effect parameters
appear only while their effect is enabled; bypass hides the parameters while
preserving their settings. Composition details and instruments
live in native expandable sections.

The player has one set of transport and volume controls. Its seek bar supports
pointer and keyboard input during playback; track metadata is under **Track
details**. System playback controls are available automatically where supported.

**Randomize** chooses a different atmosphere and a fresh random seed, resetting
the form and key locks. It works during playback or while paused. The system
Next Track action uses the same randomizer. **New composition**, beside it,
generates a fresh song while keeping the current effects, atmosphere, tempo, and form/key settings.
Both buttons have short captions and native tooltips explaining the difference.

Session controls reset on reload. Played tracks are not saved, and MIDI export
is not available.

The header offers **Light**, **Dark**, and **System** appearance. The choice persists
locally, follows OS changes in System mode, and updates both the interface and
cover art without restarting playback.

## Ownership

`src/audio` owns composition, arrangement, synthesis, effects, playback, settings,
cover art, and system-media integration. Cover art
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
