import { describe, expect, test } from "vitest";
import { generateMusicPiece } from "../composition/generator";
import { NO_MUTED_PARTS } from "../composition/roots";
import { captureMusicReplayRecipe } from "../playback/replay";
import type { MusicRuntimeSnapshot } from "../playback/types";
import { DEFAULT_MUSIC_EFFECTS } from "../synthesis/effects/config";
import { DEFAULT_MUSIC_CHORDS } from "../composition/chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "../composition/rhythm-lute-config";

const fixtureConfig = {
  rootId: "hearth",
  bpm: 80,
  masterSeed: 1,
  pieceIndex: 0,
  variationIndex: 0,
  performanceIndex: 0,
  novelty: 0.5,
  chords: DEFAULT_MUSIC_CHORDS,
  rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
  humanization: 0.55,
  formOverride: null,
  tonicOverride: null,
  autoAdvance: true,
  mutedParts: NO_MUTED_PARTS,
} as const;
const fixturePiece = generateMusicPiece(fixtureConfig);
const fixtureRecipe = captureMusicReplayRecipe(fixtureConfig, fixturePiece);
import { SystemMediaSession } from "./session";
import type { SystemMediaAction, SystemMediaPlaybackState, SystemMediaPosition, SystemMediaTrack } from "./types";

function snapshot(overrides: Partial<MusicRuntimeSnapshot> = {}): MusicRuntimeSnapshot {
  return {
    status: "playing",
    pieceStartNonce: 0,
    piece: fixturePiece,
    recipe: fixtureRecipe,
    lineup: [{ part: "strings", style: "renaissance-lute", technique: "melody" }],
    soundingEffects: DEFAULT_MUSIC_EFFECTS,
    rootId: "hearth",
    pieceIndex: 0,
    compositionSeed: 1,
    variationSeed: 2,
    performanceSeed: 3,
    sectionId: "a",
    form: "strophic",
    tonicMidi: 48,
    durationSeconds: 100,
    gapSeconds: 5,
    name: "A Bench by the Fire",
    ...overrides,
  };
}

function harness() {
  const tracks: Array<{ track: SystemMediaTrack | null; artworkUrl: string | null }> = [];
  const states: SystemMediaPlaybackState[] = [];
  const positions: Array<SystemMediaPosition | null> = [];
  const handlers = new Map<SystemMediaAction, (() => void) | null>();
  const commands: string[] = [];
  const presence = { claims: 0, releases: 0, disposals: 0 };
  let clock = 0;

  const session = new SystemMediaSession(
    {
      setTrack: (track, artworkUrl) => tracks.push({ track, artworkUrl }),
      setPlaybackState: (state) => states.push(state),
      setPosition: (position) => positions.push(position),
      setActionHandler: (action, handler) => handlers.set(action, handler),
    },
    {
      claim: () => {
        presence.claims += 1;
      },
      release: () => {
        presence.releases += 1;
      },
      dispose: () => {
        presence.disposals += 1;
      },
    },
    {
      play: () => commands.push("play"),
      pause: () => commands.push("pause"),
      skip: () => commands.push("skip"),
    },
    () => clock,
  );

  return {
    session,
    tracks,
    states,
    positions,
    handlers,
    commands,
    presence,
    advance(ms: number) {
      clock += ms;
    },
    invoke(action: SystemMediaAction) {
      handlers.get(action)?.();
    },
  };
}

describe("system media session", () => {
  test("publishes the piece, its state, and where it started", () => {
    const host = harness();
    host.session.attach();
    host.session.sync(snapshot(), true);

    expect(host.tracks).toHaveLength(1);
    expect(host.tracks[0]!.track?.title).toBe("A Bench by the Fire");
    expect(host.states).toEqual(["playing"]);
    expect(host.positions[0]).toEqual({ durationSeconds: 100, positionSeconds: 0 });
    expect(host.presence.claims).toBe(1);
  });

  test("publishes nothing until it is attached, then catches up", () => {
    const host = harness();
    host.session.sync(snapshot(), true);
    expect(host.tracks).toHaveLength(0);

    host.session.attach();
    expect(host.tracks).toHaveLength(1);
    expect(host.states).toEqual(["playing"]);
  });

  test("a scheduler tick on the same take republishes nothing", () => {
    const host = harness();
    host.session.attach();
    host.session.sync(snapshot(), true);
    host.session.sync(snapshot({ sectionId: "b" }), true);
    host.session.sync(snapshot({ sectionId: "c" }), true);

    expect(host.tracks).toHaveLength(1);
    expect(host.states).toEqual(["playing"]);
    expect(host.positions).toHaveLength(1);
  });

  test("a new piece republishes the metadata and restarts the progress", () => {
    const host = harness();
    host.session.attach();
    host.session.sync(snapshot(), true);
    host.advance(30_000);
    host.session.sync(snapshot({ pieceIndex: 1, name: "The Long Road Out" }), true);

    expect(host.tracks.map((entry) => entry.track?.title)).toEqual(["A Bench by the Fire", "The Long Road Out"]);
    expect(host.positions.at(-1)).toEqual({ durationSeconds: 100, positionSeconds: 0 });
  });

  test("pausing keeps the piece on screen at the time it stopped", () => {
    const host = harness();
    host.session.attach();
    host.session.sync(snapshot(), true);
    host.advance(12_000);
    host.session.sync(snapshot({ status: "stopped" }), false);

    expect(host.states).toEqual(["playing", "paused"]);
    expect(host.positions.at(-1)).toEqual({ durationSeconds: 100, positionSeconds: 12 });
    expect(host.tracks).toHaveLength(1);
    expect(host.presence.releases).toBe(1);
  });

  test("paused wall-clock time does not advance the resumed position", () => {
    const host = harness();
    host.session.attach();
    host.session.sync(snapshot(), true);
    host.advance(30_000);
    host.session.sync(snapshot({ status: "stopped" }), false);
    // A minute paused from Control Center; the score resumes where it stopped.
    host.advance(60_000);
    host.session.sync(snapshot(), true);
    expect(host.positions.at(-1)).toEqual({ durationSeconds: 100, positionSeconds: 30 });

    host.advance(10_000);
    host.session.sync(snapshot({ status: "stopped" }), false);
    expect(host.positions.at(-1)).toEqual({ durationSeconds: 100, positionSeconds: 40 });
  });

  test("elapsed time never runs past the piece", () => {
    const host = harness();
    host.session.attach();
    host.session.sync(snapshot(), true);
    host.advance(500_000);
    host.session.sync(snapshot({ status: "stopped" }), false);

    expect(host.positions.at(-1)).toEqual({ durationSeconds: 100, positionSeconds: 100 });
  });

  test("holds presence across the gap between pieces", () => {
    const host = harness();
    host.session.attach();
    host.session.sync(snapshot(), true);
    host.session.sync(snapshot({ status: "gap", sectionId: null }), true);

    expect(host.presence.releases).toBe(0);
    expect(host.states).toEqual(["playing"]);
  });

  test("forwards only the actions the application can honour", () => {
    const host = harness();
    host.session.attach();
    host.session.sync(snapshot(), true);

    host.invoke("play");
    host.invoke("pause");
    host.invoke("stop");
    host.invoke("nexttrack");

    expect(host.commands).toEqual(["play", "pause", "pause", "skip"]);
    expect(host.handlers.has("play")).toBe(true);
  });

  test("detaching clears the handlers before the metadata", () => {
    const host = harness();
    host.session.attach();
    host.session.sync(snapshot(), true);
    host.session.detach();

    expect([...host.handlers.values()].every((handler) => handler === null)).toBe(true);
    expect(host.states.at(-1)).toBe("none");
    expect(host.tracks.at(-1)).toEqual({ track: null, artworkUrl: null });
    expect(host.presence.releases).toBeGreaterThan(0);
  });

  test("a detached session answers nothing and publishes nothing", () => {
    const host = harness();
    host.session.attach();
    host.session.sync(snapshot(), true);
    const handler = host.handlers.get("nexttrack");
    host.session.detach();
    handler?.();
    host.session.sync(snapshot({ pieceIndex: 4 }), true);

    expect(host.commands).toEqual([]);
    expect(host.tracks.at(-1)?.track).toBeNull();
  });

  test("artwork arriving later re-publishes the piece with it", () => {
    const host = harness();
    host.session.attach();
    host.session.sync(snapshot(), true);
    host.session.setArtwork("data:image/png;base64,AAA");

    expect(host.tracks.at(-1)).toEqual({
      track: host.tracks[0]!.track,
      artworkUrl: "data:image/png;base64,AAA",
    });
    host.session.setArtwork("data:image/png;base64,AAA");
    expect(host.tracks).toHaveLength(2);
  });

  test("re-attaching republishes what is playing", () => {
    const host = harness();
    host.session.attach();
    host.session.sync(snapshot(), true);
    host.session.detach();
    host.session.attach();

    expect(host.tracks.at(-1)?.track).toBeNull();
    host.session.sync(snapshot(), true);
    expect(host.tracks.at(-1)?.track?.title).toBe("A Bench by the Fire");
    expect(host.states.at(-1)).toBe("playing");
  });

  test("disposing gives up the element as well as the surface", () => {
    const host = harness();
    host.session.attach();
    host.session.sync(snapshot(), true);
    host.session.dispose();

    expect(host.presence.disposals).toBe(1);
    expect(host.states.at(-1)).toBe("none");
  });
});
