# Audio architecture

## Ownership

`MusicApplication` is the browser composition root and lifecycle owner. It
constructs one `MusicPlaybackPort`, implemented by `TavernMusicEngine`, and an
editable `MusicSession` without attaching external behavior. The application
owns settings observation, preference application, gesture
unlock, attachment reference counting, and disposal. The mounted music host
owns browser listeners and system-media mirroring for its lifetime.

`MusicSession` is the command surface for editable repertoire behavior. Its
ordinary edits use the pure transitions in `playback/session-state.ts`; its
director attachment and debounced engine configuration live in the focused
`playback/session-lifecycle.ts` controller. React reads the owned session
through `playback/react.ts`, which provides hooks without mirroring commands.
There is no intermediate method-for-method playback wrapper.

Composition, arrangement, playback, synthesis, effects, cover art, system media,
settings, and debugging remain independently
testable concerns. New consumers should import from the module that owns the
behavior rather than reaching through the engine. Every generated performance
recasts the rack from its own performance seed — a weighted coin picks which
modules join the take, amounts drift in small bands, and the room only ever
opens further — while the session settings and bypass keep
exactly what the listener set. The sounding rack is published in the runtime
snapshot, so the debug switches show what each take runs; a switch flipped
mid-take overrides that take until the next piece.

## Procedural song arrangement

Composition plans a song, not a stream. `composition/form.ts` gives every
section a role — prelude, solo verse, tutti refrain, second-lute interlude,
postlude — plus the bridged caesura bars between them, and that plan is the
authority for which parts sound. `composition/rhythm-lute.ts` is the arrangement engine behind the
roles; nothing downstream of the generator needs to know they exist.

## Procedural lute performance

The score renders a lead lute and a second lute arranged as a responsorial
song: a rhythm-lute prelude and postlude frame solo verses and tutti refrains,
with interludes and caesura bridges carrying the accompaniment alone. Score
events do not overlap within their own lute, while synthesized course decay is
allowed to ring beneath following attacks. Each part has independent
generation, mute, performance seed, and gain behavior.

Playback renders seeded DSP in a dedicated worker and transfers its per-note
PCM directly to a small `AudioWorklet` source. The main thread performs only
scheduling and graph control, the real-time audio thread performs no long DSP
passes, and scheduled notes allocate no native `AudioBuffer` objects. A
transfer that loses the race with its note's scheduled start resumes from the
wall-clock position behind a few-millisecond fade, so a delayed render or a
busy main thread costs one softened attack rather than a crack. Hosts
without Worker and `AudioWorklet` support retain the same deterministic
TypeScript renderer as a compatibility fallback, using a render pool for PCM
output, paired courses, excitation noise, and delay lines.

Instruments outside this lute arrangement are not represented. Introducing a
new instrument is an explicit end-to-end feature across composition,
performance, synthesis, playback, presentation, and verification.
