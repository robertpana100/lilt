# Extraction notes

Lilt is an independent repository extracted from The City Remembers on
4 September 2026. It uses its own npm manifest, lockfile, build, test setup,
local-storage namespace, artwork palette, and application entry point.
There are no package links, source symlinks, or imports into the game repository.

The library (history, favourites, search, and saved-track replay) and MIDI export
were subsequently removed. The ownership table below reflects the current app;
the extraction verification records the features present at that time. The UI
now uses native HTML controls and plain CSS; the original shadcn/Base UI and
Tailwind dependencies have been removed.

## Boundaries reviewed

The original music feature lived in `packages/game-client/src/audio`, the music
player components, music debug controls, the build-profile entry, and platform
media integration. Searches across game-model, game-engine, game-rules,
game-content, game, game-client, web, and desktop found no game simulation
requirement in the music engine. Web and desktop consumed the shared client.

| Concern | Lilt owner |
| --- | --- |
| Composition, forms, seeds, arrangement, repertoire | `src/audio/composition` |
| Instrument DSP, render worker, audio worklet, effects | `src/audio/synthesis` |
| Scheduling, transitions, transport, editable session | `src/audio/playback` |
| Browser lifecycle and preferences | `src/audio/ProceduralMusic.tsx`, `src/audio/musicSettings.ts` |
| Deterministic cover design and drawing | `src/audio/cover-art` |
| OS media metadata, presence, and transport | `src/audio/system-media` |
| App colors, artwork subscription, feedback | `src/appearance`, `src/app` |
| Listening, repertoire, sound desk | `src/components/music` |

Tauri's game windows, tray, save repository, game loop, companion view, and build
profiles are outside this browser app. Lilt retains the browser Media Session
adapter for now-playing metadata and hardware media actions where supported.
A native desktop wrapper would be a separate addition.

## Preserved and changed

At extraction, composition and DSP were preserved, including all original 227
audio tests across 39 files. No tempo ranges, musical probabilities, synthesis parameters, replay
formats, or library limits were rebalanced during extraction. The existing lute
ensemble remains the implemented instrument system; the broader name does not
imply other instruments have been added.

The app and media artist are Lilt. Browser settings and worklet registration
use the Lilt namespace. Cover art now
receives colors as an input instead of importing the game's theme. Fresh visits
wait for an explicit Play action. Later visits retain the playback preference
and remain subject to browser autoplay rules.

Game saves and music libraries are not migrated or read. Browser preferences
belong to the origin, so ports 5174 (development) and 4174 (preview) have separate
settings. Existing Lilt library data is no longer read or written. Stored
favourites playback preferences fall back to Automatic.

Detailed controls are available in Manual mode, with advanced settings in
expandable sections and no debug-panel or game provider dependency. Notifications report failed playback. Appearance supports light, dark, and system
settings, including the cover art. Product slogans and explanatory UI prose have
been removed.

## Verification

At extraction, `npm run verify` passed: typechecking, 249 tests across 46 files, lint, formatting,
production build, and `git diff --check`. New integration regressions cover
manual control, persisted playback, error feedback, media-artwork subscription
and cleanup, preference isolation, appearance persistence/system changes, and real
composition/mute/effect commands.

Initial extraction browser checks covered playback, recording history, favouriting,
replay, and MIDI export. After the layout revision, browser checks covered the
single-page controls and collections, appearance persistence, OS appearance changes,
continued playback across theme changes, and widths of 320, 390, 768, 1024, and
1440 px with no horizontal overflow.
The production console contained no warnings or errors during those checks.
Hardware media behavior is covered through the adapter tests; no physical
keyboard media-key test was performed.

The production bundle includes its own renderer worker, audio worklet, and
system fonts. There are no audio samples or remote generation calls.
No game simulation run was needed: the game simulation was not changed.
