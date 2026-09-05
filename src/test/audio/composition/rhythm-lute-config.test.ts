import { describe, expect, test } from "vitest";
import { DEFAULT_MUSIC_RHYTHM_LUTE, normalizeMusicRhythmLute } from "@/audio/composition/rhythm-lute-config";

describe("rhythm lute config", () => {
  test("normalizes missing values to authored defaults", () => {
    expect(normalizeMusicRhythmLute(undefined)).toEqual(DEFAULT_MUSIC_RHYTHM_LUTE);
  });

  test("clamps density, level, course count, and strum spread", () => {
    expect(normalizeMusicRhythmLute({ density: -1, level: 3, maxCourses: 4, strumMs: 90 })).toEqual({
      density: 0,
      level: 1,
      maxCourses: 3,
      strumMs: 40,
    });
  });
});
