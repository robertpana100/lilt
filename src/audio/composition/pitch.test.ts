import { describe, expect, test } from "vitest";
import { fitToRangeNear } from "./pitch";

describe("pitch range folding", () => {
  test("folds every pitch class into an octave-and-more range", () => {
    for (let note = 40; note <= 96; note += 1) {
      const fitted = fitToRangeNear(note, [60, 76], null);
      expect(fitted).toBeGreaterThanOrEqual(60);
      expect(fitted).toBeLessThanOrEqual(76);
      // Folding moves only by octaves, so the pitch class is preserved.
      expect((fitted - note) % 12 === 0).toBe(true);
    }
  });

  test("a range narrower than an octave still answers inside itself", () => {
    for (let note = 40; note <= 96; note += 1) {
      const fitted = fitToRangeNear(note, [60, 66], null);
      expect(fitted).toBeGreaterThanOrEqual(60);
      expect(fitted).toBeLessThanOrEqual(66);
    }
    expect(fitToRangeNear(68, [60, 66], null)).toBe(60);
  });

  test("with a previous pitch, the in-range candidate nearest it wins", () => {
    expect(fitToRangeNear(64, [60, 76], 74)).toBe(76);
    expect(fitToRangeNear(64, [60, 76], 62)).toBe(64);
  });
});
