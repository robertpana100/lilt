# Extraction notes

Lilt is an independent repository extracted from The City Remembers on
4 September 2026. It uses its own npm manifest, lockfile, build, test setup,
local-storage namespace, artwork palette, and application entry point.
There are no package links, source symlinks, or imports into the game repository.

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
| Scheduling, transitions, replay, transport, editable session | `src/audio/playback` |
| Browser lifecycle and preferences | `src/audio/ProceduralMusic.tsx`, `src/audio/musicSettings.ts` |
| Played history, favourite recipes, search, persistence | `src/audio/library` |
| MIDI bytes and download | `src/audio/export` |
| Deterministic cover design and drawing | `src/audio/cover-art` |
| OS media metadata, presence, and transport | `src/audio/system-media` |
| App colors, artwork subscription, feedback | `src/appearance`, `src/app` |
| Listening, repertoire, library, sound desk | `src/components/music` |

Tauri's game windows, tray, save repository, game loop, companion view, and build
profiles are outside this browser app. Lilt retains the browser Media Session
adapter for now-playing metadata and hardware media actions where supported.
A native desktop wrapper would be a separate addition.

## Preserved and changed

Composition and DSP are preserved, including all original 227 audio tests across
39 files. No tempo ranges, musical probabilities, synthesis parameters, replay
formats, or library limits were rebalanced during extraction. The existing lute
ensemble remains the implemented instrument system; the broader name does not
imply other instruments have been added.

The app and media artist are Lilt. Browser settings, library storage, worklet
registration, and unnamed MIDI downloads use the Lilt namespace. Cover art now
receives colors as an input instead of importing the game's theme. Fresh visits
wait for an explicit Play action. Later visits retain the playback preference
and remain subject to browser autoplay rules.

Game saves and music libraries are not migrated or read. Settings and favourites
belong to the browser origin, so ports 5174 (development) and 4174 (preview) have
separate libraries. No server persistence or cloud sync is provided.

The detailed controls are available in production under Sound desk, with their
own section metadata and no debug-panel or game provider dependency. The desk
loads on demand. Notifications visibly report failed playback, storage failures,
favourite changes, and exports.

## Verification

`npm run verify` passes: typechecking, 244 tests across 45 files, lint, formatting,
production build, and `git diff --check`. New integration regressions cover
manual control, persisted playback, error feedback, media-artwork subscription
and cleanup, preference isolation, and real composition/mute/effect commands.

Browser checks covered initial playback, advancing progress, recording history,
favouriting and replay, MIDI export feedback, desktop and 390 px mobile layouts,
production playback, and lazy Sound desk loading.
The production console contained no warnings or errors during those checks.
Hardware media behavior is covered through the adapter tests; no physical
keyboard media-key test was performed.

The production bundle includes its own renderer worker, audio worklet, and
locally bundled font. There are no audio samples or remote generation calls.
No game simulation run was needed: the game simulation was not changed.
