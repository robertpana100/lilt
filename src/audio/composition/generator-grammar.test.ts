import { describe, expect, test } from "vitest";
import { config, courseEvents, sectionMelody, withoutPerformance } from "../tavern-music.test-support";
import { generateMusicPiece } from "./generator";
import { MUSIC_FORM_LABELS, MUSIC_ROOTS } from "./roots";

describe("music generation grammar", () => {
  test("generates complete deterministic pieces for all nine roots", () => {
    expect(MUSIC_ROOTS).toHaveLength(9);
    for (const root of MUSIC_ROOTS) {
      const first = generateMusicPiece(config(root.id));
      expect(first).toEqual(generateMusicPiece(config(root.id)));
      expect(first.durationSeconds).toBeGreaterThanOrEqual(90);
      expect(first.durationSeconds).toBeLessThanOrEqual(180);
      expect(first.gapSeconds).toBeGreaterThanOrEqual(4);
      expect(first.gapSeconds).toBeLessThanOrEqual(12);
      expect(first.sections.length).toBeGreaterThan(3);
      expect(first.sections.at(-1)?.cadence).toBe("closed");
      expect(MUSIC_FORM_LABELS[first.form].length).toBeGreaterThan(0);
    }
  });

  test("keeps composition, variation, and performance streams independent", () => {
    const base = generateMusicPiece(config("road"));
    const variation = generateMusicPiece(config("road", { variationIndex: 1 }));
    const performance = generateMusicPiece(config("road", { performanceIndex: 1 }));

    expect(variation.compositionSeed).toBe(base.compositionSeed);
    expect(variation.phrases).toEqual(base.phrases);
    expect(variation.variationSeed).not.toBe(base.variationSeed);
    expect(variation.events).not.toEqual(base.events);
    expect(performance.performanceSeed).not.toBe(base.performanceSeed);
    expect(withoutPerformance(performance)).toEqual(withoutPerformance(base));
  });

  test("different seeds create genuinely different phrase identities", () => {
    const identities = new Set(
      Array.from({ length: 16 }, (_, index) => {
        const piece = generateMusicPiece(config("hearth", { masterSeed: index + 1 }));
        return JSON.stringify({ tonic: piece.tonicMidi, form: piece.form, phrases: piece.phrases });
      }),
    );
    expect(identities.size).toBeGreaterThanOrEqual(12);
  });

  test("produces ordered, pulse-aligned, bounded events and a final tonic", () => {
    for (const root of MUSIC_ROOTS) {
      const piece = generateMusicPiece(config(root.id, { masterSeed: 2026, novelty: 0.72 }));
      let previousPulse = -1;
      for (const event of piece.events) {
        expect(Number.isInteger(event.startPulse)).toBe(true);
        expect(Number.isInteger(event.durationPulses)).toBe(true);
        expect(event.startPulse).toBeGreaterThanOrEqual(previousPulse);
        expect(event.startPulse).toBeGreaterThanOrEqual(0);
        expect(event.startPulse + event.durationPulses).toBeLessThanOrEqual(piece.totalPulses);
        expect(event.durationPulses).toBeGreaterThan(0);
        expect(event.velocity).toBeGreaterThan(0);
        expect(event.velocity).toBeLessThanOrEqual(1);
        if (event.kind === "course") {
          expect(event.pitches.every(Number.isFinite)).toBe(true);
          if (event.part === "strings") {
            expect(event.pitches[0]).toBeGreaterThanOrEqual(root.style.melodyRange[0]);
            expect(event.pitches[0]).toBeLessThanOrEqual(root.style.melodyRange[1]);
          } else {
            expect(event.pitches[0]).toBeGreaterThanOrEqual(43);
            expect(event.pitches.at(-1)).toBeLessThanOrEqual(67);
          }
        }
        previousPulse = event.startPulse;
      }
      const lastMelody = courseEvents(piece).at(-1);
      expect(lastMelody).toBeDefined();
      expect(lastMelody!.pitches[0] % 12).toBe(piece.tonicMidi % 12);
    }
  });

  test("favors source-derived stepwise motion and limits large leaps", () => {
    let recoverableLeaps = 0;
    let contraryStepRecoveries = 0;
    for (const root of MUSIC_ROOTS) {
      const intervalGroups = Array.from({ length: 12 }, (_, seed) =>
        generateMusicPiece(config(root.id, { masterSeed: seed + 1 })),
      ).flatMap((piece) =>
        piece.sections.map((_, sectionIndex) => {
          const pitches = sectionMelody(piece, sectionIndex).map((event) => event.pitches[0]);
          return pitches.slice(1).map((pitch, index) => pitch - pitches[index]!);
        }),
      );
      const intervals = intervalGroups.flat();
      const stepwise = intervals.filter((interval) => Math.abs(interval) <= 2).length / intervals.length;
      const largeLeaps = intervals.filter((interval) => Math.abs(interval) >= 5).length / intervals.length;
      expect(stepwise).toBeGreaterThanOrEqual(0.64);
      expect(stepwise).toBeLessThanOrEqual(0.9);
      expect(largeLeaps).toBeLessThanOrEqual(0.18);
      intervalGroups.forEach((group) =>
        group.forEach((interval, index) => {
          if (Math.abs(interval) < 5 || index >= group.length - 1) return;
          recoverableLeaps += 1;
          const next = group[index + 1]!;
          if (next !== 0 && Math.sign(next) !== Math.sign(interval) && Math.abs(next) <= 4) contraryStepRecoveries += 1;
        }),
      );
    }
    expect(contraryStepRecoveries / recoverableLeaps).toBeGreaterThan(0.5);
  });

  test("voices chords inside one non-overlapping lute line", () => {
    for (const root of MUSIC_ROOTS) {
      for (let seed = 1; seed <= 8; seed += 1) {
        const piece = generateMusicPiece(config(root.id, { masterSeed: seed }));
        const courses = courseEvents(piece);
        expect(
          piece.sections
            .filter((section) => section.role !== "prelude" && section.role !== "interlude")
            .every((section) => section.activeParts.includes("strings")),
        ).toBe(true);
        expect(courses.some((event) => event.pitches.length === 3)).toBe(true);
        expect(courses.filter((event) => event.pitches.length > 1).length / courses.length).toBeLessThan(0.25);
        courses.forEach((event, index) => {
          expect(event.part).toBe("strings");
          expect(event.pitches.length).toBeGreaterThanOrEqual(1);
          expect(event.pitches.length).toBeLessThanOrEqual(3);
          expect(new Set(event.pitches).size).toBe(event.pitches.length);
          expect(event.pitches.slice(1).every((pitch) => pitch < event.pitches[0])).toBe(true);
          expect(event.pitches.every((pitch) => Number.isInteger(pitch) && pitch >= 40)).toBe(true);
          const next = courses[index + 1];
          if (next) expect(event.startPulse + event.durationPulses).toBeLessThanOrEqual(next.startPulse);
        });
      }
    }
  });
});
