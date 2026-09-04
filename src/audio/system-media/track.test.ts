import { describe, expect, test } from "vitest";
import { getMusicRoot } from "../composition/roots";
import { generateMusicPiece } from "../composition/generator";
import { NO_MUTED_PARTS } from "../composition/roots";
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
import { systemMediaIsSounding, systemMediaPlaybackState, systemMediaTrack, systemMediaTrackKey } from "./track";

function snapshot(overrides: Partial<MusicRuntimeSnapshot> = {}): MusicRuntimeSnapshot {
  return {
    status: "playing",
    piece: fixturePiece,
    lineup: [{ part: "strings", style: "oud", technique: "melody" }],
    soundingEffects: DEFAULT_MUSIC_EFFECTS,
    rootId: "lament",
    pieceIndex: 3,
    compositionSeed: 11,
    variationSeed: 12,
    performanceSeed: 13,
    sectionId: "a",
    form: "strophic",
    tonicMidi: 50,
    durationSeconds: 120,
    gapSeconds: 6,
    name: "The Empty Chair at Vespers",
    ...overrides,
  };
}

describe("system media track", () => {
  test("names the piece, artist, and root it came from", () => {
    expect(systemMediaTrack(snapshot())).toEqual({
      title: "The Empty Chair at Vespers",
      artist: "Lilt",
      album: getMusicRoot("lament").name,
      genre: getMusicRoot("lament").theme,
      durationSeconds: 120,
    });
  });

  test("uses the product credit regardless of the sounding lineup", () => {
    const artist = systemMediaTrack(
      snapshot({
        lineup: [{ part: "strings", style: "renaissance-lute", technique: "melody" }],
        soundingEffects: DEFAULT_MUSIC_EFFECTS,
      }),
    ).artist;

    expect(artist).toBe("Lilt");
  });

  test("a piece with no sounding parts still has a title and artist", () => {
    expect(systemMediaTrack(snapshot({ lineup: [] }))).toMatchObject({
      title: "The Empty Chair at Vespers",
      artist: "Lilt",
    });
  });

  test("the same take keeps one identity while a reroll takes a new one", () => {
    const key = systemMediaTrackKey(snapshot());

    expect(systemMediaTrackKey(snapshot({ status: "gap", sectionId: "b" }))).toBe(key);
    expect(systemMediaTrackKey(snapshot({ variationSeed: 99 }))).not.toBe(key);
    expect(
      systemMediaTrackKey(
        snapshot({
          lineup: [{ part: "strings", style: "gittern", technique: "melody" }],
        }),
      ),
    ).not.toBe(key);
  });

  test("playing and the gap between pieces keep the media session active", () => {
    for (const status of ["playing", "gap"] as const) {
      expect(systemMediaPlaybackState(status, true)).toBe("playing");
    }
    for (const status of ["stopped", "complete", "error"] as const) {
      expect(systemMediaPlaybackState(status, true)).toBe("paused");
    }
  });

  test("music switched off is paused rather than gone", () => {
    expect(systemMediaPlaybackState("playing", false)).toBe("paused");
  });

  test("only a running score is treated as reaching the speakers", () => {
    expect(systemMediaIsSounding("playing")).toBe(true);
    expect(systemMediaIsSounding("gap")).toBe(true);
    expect(systemMediaIsSounding("error")).toBe(false);
    expect(systemMediaIsSounding("stopped")).toBe(false);
  });
});
