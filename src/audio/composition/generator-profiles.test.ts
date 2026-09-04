import { describe, expect, test } from "vitest";
import { config, courseEvents, rhythmEvents } from "../tavern-music.test-support";
import { generateMusicPiece, generateNextMusicPiece, getPerformanceVariation } from "./generator";
import { musicPieceLineup } from "./lineup";
import { MUSIC_ROOTS, NO_MUTED_PARTS, pulsesPerBar } from "./roots";

describe("music generation profiles and output", () => {
  test("drone roots sustain the final and fifth instead of chords", () => {
    for (const rootId of ["hearth", "lament", "courtly"] as const) {
      const piece = generateMusicPiece(config(rootId));
      const rhythm = rhythmEvents(piece);
      expect(rhythm.length).toBeGreaterThan(0);
      const finalPitchClass = piece.tonicMidi % 12;
      rhythm.forEach((event, index) => {
        expect(event.pitches.length).toBeGreaterThanOrEqual(2);
        for (const pitch of event.pitches) {
          const offset = (((pitch - finalPitchClass) % 12) + 12) % 12;
          expect([0, 7]).toContain(offset);
        }
        const next = rhythm[index + 1];
        if (next) expect(event.startPulse + event.durationPulses).toBeLessThanOrEqual(next.startPulse);
      });
      const entry = musicPieceLineup(piece, NO_MUTED_PARTS).find((part) => part.part === "rhythm");
      expect(entry?.technique).toBe("drone");
    }
    for (const root of MUSIC_ROOTS.filter((entry) => entry.rhythmLuteTechnique === "chords")) {
      const piece = generateMusicPiece(config(root.id));
      const entry = musicPieceLineup(piece, NO_MUTED_PARTS).find((part) => part.part === "rhythm");
      expect(entry?.technique).toBe("rhythm");
    }
  });

  test("ballata keeps lead strings within one lute instrument", () => {
    const piece = generateMusicPiece(config("guildhall", { formOverride: "ballata", masterSeed: 19 }));
    expect(piece.events.length).toBeGreaterThan(20);
    expect(courseEvents(piece).every((event) => event.part === "strings")).toBe(true);
    expect(courseEvents(piece).every((event) => event.pitches.length >= 1)).toBe(true);
    expect(courseEvents(piece).some((event) => event.pitches.length > 1)).toBe(true);
    expect(new Set(piece.sections.map((section) => section.label))).toEqual(
      new Set(["Prelude", "Ripresa", "Primo piede", "Secondo piede", "Volta", "Coda"]),
    );
  });

  test("novelty expands phrase transformations", () => {
    let lowNoveltyTransforms = 0;
    let highNoveltyTransforms = 0;
    for (let seed = 1; seed <= 12; seed += 1) {
      const low = generateMusicPiece(config("revelry", { masterSeed: seed, novelty: 0.05 }));
      const high = generateMusicPiece(config("revelry", { masterSeed: seed, novelty: 0.95 }));
      lowNoveltyTransforms += low.sections.filter((section) =>
        ["answer", "ornament", "rhythmic-variation"].includes(section.transform),
      ).length;
      highNoveltyTransforms += high.sections.filter((section) =>
        ["answer", "ornament", "rhythmic-variation"].includes(section.transform),
      ).length;
    }
    expect(highNoveltyTransforms).toBeGreaterThan(lowNoveltyTransforms);
  });

  test("humanization is deterministic, bounded, and cannot cross an adjacent pulse", () => {
    const piece = generateMusicPiece(config("brawl", { humanization: 1 }));
    piece.events.forEach((event, index) => {
      const performance = getPerformanceVariation(piece, index, 1);
      expect(performance).toEqual(getPerformanceVariation(piece, index, 1));
      expect(Math.abs(performance.startOffsetSeconds)).toBeLessThanOrEqual(piece.pulseSeconds * 0.4);
      expect(performance.durationScale).toBeGreaterThanOrEqual(0.92);
      expect(performance.durationScale).toBeLessThanOrEqual(1.08);
      expect(performance.velocityScale).toBeGreaterThanOrEqual(0.88);
      expect(performance.velocityScale).toBeLessThanOrEqual(1.12);
      if (event.startPulse === 0) expect(performance.startOffsetSeconds).toBeGreaterThanOrEqual(0);
    });
  });

  test("advances repertoire only when automatic playback is enabled", () => {
    const enabled = config("lament", { pieceIndex: 3, autoAdvance: true });
    expect(generateNextMusicPiece(enabled, 3)?.pieceIndex).toBe(4);
    expect(generateNextMusicPiece({ ...enabled, autoAdvance: false }, 3)).toBeNull();
  });

  test("root style profiles and lute bodies are internally valid", () => {
    for (const root of MUSIC_ROOTS) {
      expect(root.tempo.min).toBeLessThan(root.tempo.default);
      expect(root.tempo.default).toBeLessThan(root.tempo.max);
      expect(root.style.rhythmCells.flat().every((duration) => Number.isInteger(duration) && duration > 0)).toBe(true);
      expect(
        Object.values(root.style.cadences)
          .flat()
          .every((cadence) => cadence.degrees.length === cadence.durations.length),
      ).toBe(true);
      expect(pulsesPerBar(root.meter)).toBeGreaterThan(0);
      expect(root.safeTonics.length).toBeGreaterThan(2);
      expect(root.forms.length).toBeGreaterThan(0);
      expect(["renaissance-lute", "gittern", "oud"]).toContain(root.luteStyle);
    }
  });
});
