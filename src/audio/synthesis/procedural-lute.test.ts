import { describe, expect, test } from "vitest";
import { ProceduralLuteRenderPool } from "./procedural-lute";

const sampleRate = 12_000;

function course(overrides: Partial<Parameters<ProceduralLuteRenderPool["renderCourse"]>[0]> = {}) {
  return new ProceduralLuteRenderPool().renderCourse({
    style: "renaissance-lute",
    technique: "melody",
    midi: 57,
    sampleRate,
    durationSeconds: 1.2,
    seed: 42,
    ...overrides,
  });
}

function rms(samples: Float32Array): number {
  return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / Math.max(1, samples.length));
}

function edgeEnergy(samples: Float32Array): number {
  let sum = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const difference = samples[index]! - samples[index - 1]!;
    sum += difference * difference;
  }
  return Math.sqrt(sum / Math.max(1, samples.length - 1));
}

describe("procedural lute DSP", () => {
  test("is deterministic for a saved take and varies with its seeded pluck", () => {
    const first = course();
    expect(course()).toEqual(first);
    expect(course({ seed: 43 })).not.toEqual(first);
  });

  test("keeps pooled rendering sample-identical across changing buffer lengths", () => {
    const pool = new ProceduralLuteRenderPool();
    const shortOptions = {
      style: "renaissance-lute",
      technique: "melody",
      midi: 57,
      sampleRate,
      durationSeconds: 0.4,
      seed: 42,
    } as const;
    const shortExpected = new ProceduralLuteRenderPool().renderCourse(shortOptions);
    expect(pool.renderCourse(shortOptions).slice()).toEqual(shortExpected);
    pool.renderCourse({ ...shortOptions, durationSeconds: 1.7, seed: 99 });
    expect(pool.renderCourse(shortOptions).slice()).toEqual(shortExpected);
  });

  test("renders finite, bounded PCM with a naturally decaying tail", () => {
    const samples = course();
    expect(samples).toHaveLength(Math.ceil(sampleRate * 1.2));
    expect(samples.every(Number.isFinite)).toBe(true);
    expect(Math.max(...samples.map(Math.abs))).toBeLessThanOrEqual(0.921);

    const early = samples.slice(Math.floor(sampleRate * 0.04), Math.floor(sampleRate * 0.24));
    const tail = samples.slice(-Math.floor(sampleRate * 0.2));
    expect(rms(tail)).toBeLessThan(rms(early) * 0.5);
  });

  test("normalizes every lute body to a consistent audible pluck peak", () => {
    for (const style of ["renaissance-lute", "gittern", "oud"] as const) {
      const samples = course({ style });
      expect(Math.max(...samples.map(Math.abs))).toBeCloseTo(0.92, 4);
    }
  });

  test("keeps the Karplus–Strong delay near the requested pitch", () => {
    const samples = course({ durationSeconds: 0.45 });
    const start = Math.floor(sampleRate * 0.04);
    const window = samples.slice(start, start + 2_400);
    const correlation = (lag: number) => {
      let sum = 0;
      for (let index = lag; index < window.length; index += 1) sum += window[index]! * window[index - lag]!;
      return sum;
    };
    const candidates = Array.from({ length: 35 }, (_, index) => index + 38);
    const strongestLag = candidates.reduce((best, lag) => (correlation(lag) > correlation(best) ? lag : best));
    // MIDI 57 is 220 Hz: 12 kHz / 220 ≈ 54.5 samples.
    expect(strongestLag).toBeGreaterThanOrEqual(52);
    expect(strongestLag).toBeLessThanOrEqual(57);
  });

  test("gives each historical body its own response", () => {
    const renaissance = course({ style: "renaissance-lute" });
    expect(course({ style: "gittern" })).not.toEqual(renaissance);
    expect(course({ style: "oud" })).not.toEqual(renaissance);
  });

  test("retains a crisp plucked-string transient across the lute family", () => {
    const renaissance = course({ style: "renaissance-lute" });
    const gittern = course({ style: "gittern" });
    const oud = course({ style: "oud" });
    expect(edgeEnergy(renaissance) / rms(renaissance)).toBeGreaterThan(0.4);
    expect(edgeEnergy(gittern) / rms(gittern)).toBeGreaterThan(0.35);
    expect(edgeEnergy(oud) / rms(oud)).toBeGreaterThan(0.25);
  });

  test("retains audible energy through a long natural decay", () => {
    const samples = course({ durationSeconds: 5.4 });
    const late = samples.slice(Math.floor(sampleRate * 4.2), Math.floor(sampleRate * 4.6));
    expect(samples).toHaveLength(Math.ceil(sampleRate * 5.4));
    expect(rms(late)).toBeGreaterThan(0.0001);
  });
});
