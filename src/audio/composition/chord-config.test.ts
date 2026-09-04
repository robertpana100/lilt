import { describe, expect, test } from "vitest";
import { DEFAULT_MUSIC_CHORDS, normalizeMusicChords } from "./chord-config";

describe("music chord config", () => {
  test("uses the authored defaults for missing settings", () => {
    expect(normalizeMusicChords(null)).toEqual(DEFAULT_MUSIC_CHORDS);
  });

  test("clamps amount and strum spread and rejects unsupported course counts", () => {
    expect(normalizeMusicChords({ amount: 8, maxCourses: 4, strumMs: -10 })).toEqual({
      amount: 1,
      maxCourses: 3,
      strumMs: 0,
    });
    expect(normalizeMusicChords({ amount: -2, maxCourses: 2, strumMs: 90 })).toEqual({
      amount: 0,
      maxCourses: 2,
      strumMs: 40,
    });
  });
});
