import { describe, expect, test } from "vitest";
import {
  cloneMusicEffects,
  DEFAULT_MUSIC_EFFECTS,
  ECHO_LIMITS,
  normalizeMusicEffects,
  type MusicEffectsConfig,
} from "./config";
import { varyMusicEffects } from "./variation";

const SEEDS = [1, 7, 42, 99, 1_000, 65_537, 1_234_567, 4_294_967_295];

const ENABLED_PAIRS = [
  ["chorus", (c: MusicEffectsConfig) => c.chorus.enabled],
  ["echo", (c: MusicEffectsConfig) => c.echo.enabled],
  ["reverb", (c: MusicEffectsConfig) => c.reverb.enabled],
  ["tone", (c: MusicEffectsConfig) => c.tone.enabled],
  ["tremolo", (c: MusicEffectsConfig) => c.tremolo.enabled],
  ["saturation", (c: MusicEffectsConfig) => c.saturation.enabled],
] as const;

describe("music effects variation", () => {
  test("is deterministic per performance seed and differs between performances", () => {
    const first = varyMusicEffects(DEFAULT_MUSIC_EFFECTS, 42);
    expect(varyMusicEffects(DEFAULT_MUSIC_EFFECTS, 42)).toEqual(first);
    expect(varyMusicEffects(DEFAULT_MUSIC_EFFECTS, 43)).not.toEqual(first);

    const decays = new Set(SEEDS.map((seed) => varyMusicEffects(DEFAULT_MUSIC_EFFECTS, seed).reverb.decaySeconds));
    expect(decays.size).toBeGreaterThanOrEqual(SEEDS.length - 2);
  });

  test("picks a seeded subset of modules, never the whole rack and never bone dry", () => {
    const subsets = new Set<string>();
    let rooms = 0;
    for (const seed of SEEDS) {
      const varied = varyMusicEffects(DEFAULT_MUSIC_EFFECTS, seed);
      const enabled = ENABLED_PAIRS.filter(([, read]) => read(varied)).map(([name]) => name);
      expect(enabled.length).toBeLessThan(ENABLED_PAIRS.length);
      expect(enabled.length).toBeGreaterThan(0);
      if (enabled.includes("reverb")) rooms += 1;
      subsets.add(enabled.join(","));
    }
    // The room joins most takes, and the subsets genuinely differ.
    expect(rooms).toBeGreaterThanOrEqual(SEEDS.length / 2);
    expect(subsets.size).toBeGreaterThan(1);
  });

  test("listener selection keeps the listener's switches verbatim", () => {
    const base = cloneMusicEffects(DEFAULT_MUSIC_EFFECTS);
    base.tremolo.enabled = false;
    base.echo.enabled = true;
    for (const seed of SEEDS) {
      const varied = varyMusicEffects(base, seed, { switches: "listener" });
      expect(varied.chorus.enabled).toBe(base.chorus.enabled);
      expect(varied.echo.enabled).toBe(true);
      expect(varied.reverb.enabled).toBe(base.reverb.enabled);
      expect(varied.tone.enabled).toBe(base.tone.enabled);
      expect(varied.tremolo.enabled).toBe(false);
      expect(varied.saturation.enabled).toBe(base.saturation.enabled);
    }
  });

  test("moves each parameter no farther than its band, clamped to legal range", () => {
    const bands = [
      { read: (c: MusicEffectsConfig) => c.chorus.mix, band: 0.08 },
      { read: (c: MusicEffectsConfig) => c.chorus.rateHz, band: 0.25 },
      { read: (c: MusicEffectsConfig) => c.chorus.depthMs, band: 1.5 },
      { read: (c: MusicEffectsConfig) => c.echo.mix, band: 0.02 },
      { read: (c: MusicEffectsConfig) => c.echo.delaySeconds, band: 0.03 },
      { read: (c: MusicEffectsConfig) => c.echo.feedback, band: 0.015 },
      { read: (c: MusicEffectsConfig) => c.tone.lowGainDb, band: 1.5 },
      { read: (c: MusicEffectsConfig) => c.tone.highGainDb, band: 1.5 },
      { read: (c: MusicEffectsConfig) => c.tremolo.depth, band: 0.06 },
      { read: (c: MusicEffectsConfig) => c.tremolo.rateHz, band: 1.2 },
      { read: (c: MusicEffectsConfig) => c.saturation.mix, band: 0.05 },
      { read: (c: MusicEffectsConfig) => c.saturation.drive, band: 0.08 },
    ] as const;
    for (const seed of SEEDS) {
      const varied = varyMusicEffects(DEFAULT_MUSIC_EFFECTS, seed);
      for (const { read, band } of bands) {
        expect(Math.abs(read(varied) - read(DEFAULT_MUSIC_EFFECTS))).toBeLessThanOrEqual(band + 1e-9);
      }
      // The room only ever opens up: mix and decay drift upward, never down.
      expect(varied.reverb.mix).toBeGreaterThanOrEqual(DEFAULT_MUSIC_EFFECTS.reverb.mix - 1e-9);
      expect(varied.reverb.decaySeconds).toBeGreaterThanOrEqual(DEFAULT_MUSIC_EFFECTS.reverb.decaySeconds - 1e-9);
      expect(varied.reverb.decaySeconds).toBeLessThanOrEqual(DEFAULT_MUSIC_EFFECTS.reverb.decaySeconds + 0.8 + 1e-9);
      // The echo stays inside its short-burst caps whatever it drifts to.
      expect(varied.echo.mix).toBeLessThanOrEqual(ECHO_LIMITS.maxMix);
      expect(varied.echo.delaySeconds).toBeLessThanOrEqual(ECHO_LIMITS.maxDelaySeconds);
      expect(varied.echo.feedback).toBeLessThanOrEqual(ECHO_LIMITS.maxFeedback);
    }
    // A base sitting on a clamp edge stays inside the legal range.
    const edge = cloneMusicEffects(DEFAULT_MUSIC_EFFECTS);
    edge.reverb.decaySeconds = 3;
    for (const seed of SEEDS) expect(varyMusicEffects(edge, seed).reverb.decaySeconds).toBeLessThanOrEqual(3);
  });

  test("leaves the base config untouched", () => {
    const base = cloneMusicEffects(DEFAULT_MUSIC_EFFECTS);
    const before = cloneMusicEffects(base);
    varyMusicEffects(base, 42);
    expect(base).toEqual(before);
  });

  test("varies around the listener's own settings, not the defaults", () => {
    const base = normalizeMusicEffects({
      ...cloneMusicEffects(DEFAULT_MUSIC_EFFECTS),
      reverb: { enabled: true, mix: 0.4, decaySeconds: 2.4 },
    });
    for (const seed of SEEDS) {
      const varied = varyMusicEffects(base, seed);
      expect(varied.reverb.decaySeconds).toBeGreaterThan(2.4);
      expect(varied.reverb.decaySeconds).toBeLessThan(2.4 + 0.8 + 1e-9);
    }
  });
});
