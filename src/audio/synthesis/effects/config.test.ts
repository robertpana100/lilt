import { describe, expect, test } from "vitest";
import { cloneMusicEffects, DEFAULT_MUSIC_EFFECTS, normalizeMusicEffects } from "./config";

describe("music effects config", () => {
  test("supplies the complete default rack for missing data", () => {
    expect(normalizeMusicEffects(null)).toEqual(DEFAULT_MUSIC_EFFECTS);
  });

  test("clamps unsafe feedback, timing, gain, and modulation values", () => {
    const effects = normalizeMusicEffects({
      chorus: { enabled: true, mix: 9, rateHz: -1, depthMs: 99 },
      echo: { enabled: true, mix: 9, delaySeconds: 0, feedback: 2 },
      tone: { enabled: true, lowGainDb: -99, highGainDb: 99 },
      tremolo: { enabled: true, depth: 4, rateHz: 99 },
    });

    expect(effects.chorus).toMatchObject({ mix: 0.6, rateHz: 0.05, depthMs: 12 });
    expect(effects.echo).toMatchObject({ mix: 0.06, delaySeconds: 0.06, feedback: 0.075 });
    expect(effects.tone).toMatchObject({ lowGainDb: -12, highGainDb: 12 });
    expect(effects.tremolo).toMatchObject({ depth: 1, rateHz: 12 });
  });

  test("clones every nested module for safe session edits", () => {
    const clone = cloneMusicEffects(DEFAULT_MUSIC_EFFECTS);
    clone.chorus.mix = 0.4;
    expect(DEFAULT_MUSIC_EFFECTS.chorus.mix).toBe(0.12);
  });
});
