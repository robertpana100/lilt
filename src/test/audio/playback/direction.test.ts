import { describe, expect, test } from "vitest";
import { directNextMusicPiece, nextMusicRoot, withMusicRoot } from "@/audio/playback/direction";
import { MUSIC_ROOTS, NO_MUTED_PARTS, getMusicRoot, type MusicRootId } from "@/audio/composition/roots";
import { DEFAULT_MUSIC_EFFECTS } from "@/audio/synthesis/effects/config";
import type { MusicEngineConfig } from "@/audio/playback/types";
import { DEFAULT_MUSIC_CHORDS } from "@/audio/composition/chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "@/audio/composition/rhythm-lute-config";

function engineConfig(rootId: MusicRootId = "hearth"): MusicEngineConfig {
  const root = getMusicRoot(rootId);
  return {
    rootId,
    bpm: root.tempo.default,
    masterSeed: 42,
    pieceIndex: 0,
    variationIndex: 0,
    performanceIndex: 0,
    novelty: 0.5,
    chords: DEFAULT_MUSIC_CHORDS,
    rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
    humanization: 0.55,
    formOverride: root.forms[0]!,
    tonicOverride: root.safeTonics[0]!,
    autoAdvance: true,
    mutedParts: NO_MUTED_PARTS,
    effects: DEFAULT_MUSIC_EFFECTS,
  };
}

describe("nextMusicRoot", () => {
  test("reaches every root, so nothing composed stays unheard", () => {
    const reached = new Set(MUSIC_ROOTS.map((_root, index) => nextMusicRoot(null, () => index / MUSIC_ROOTS.length)));

    expect(reached.size).toBe(MUSIC_ROOTS.length);
  });

  test("never repeats the root now playing", () => {
    const others = Array.from({ length: 40 }, (_value, index) => nextMusicRoot("hearth", () => index / 40));

    expect(others).not.toContain("hearth");
    expect(new Set(others).size).toBe(MUSIC_ROOTS.length - 1);
  });

  test("stays inside the repertoire at the edges of the range", () => {
    const ids = MUSIC_ROOTS.map((root) => root.id);

    expect(ids).toContain(nextMusicRoot(null, () => 0));
    expect(ids).toContain(nextMusicRoot(null, () => 1));
  });
});

describe("withMusicRoot", () => {
  test("takes the new root's tempo and drops what belonged to the old one", () => {
    const moved = withMusicRoot(engineConfig("hearth"), "brawl");

    expect(moved.rootId).toBe("brawl");
    expect(moved.bpm).toBe(getMusicRoot("brawl").tempo.default);
    expect(moved.formOverride).toBeNull();
    expect(moved.tonicOverride).toBeNull();
  });

  test("keeps the settings that are not about a root", () => {
    const config = engineConfig("hearth");
    const moved = withMusicRoot(config, "lament");

    expect(moved).toMatchObject({
      masterSeed: config.masterSeed,
      novelty: config.novelty,
      humanization: config.humanization,
      autoAdvance: config.autoAdvance,
    });
  });
});

describe("directNextMusicPiece", () => {
  test("automatic playback moves on to another root", () => {
    const directed = directNextMusicPiece(engineConfig("hearth"), "auto", () => 0);

    expect(directed.rootId).not.toBe("hearth");
  });

  test("a player who took control keeps the root they chose", () => {
    const config = engineConfig("hearth");

    expect(directNextMusicPiece(config, "override", () => 0)).toBe(config);
  });
});
