import { clampedNumber } from "../valueGuards";

export interface MusicRhythmLuteConfig {
  /** Frequency and complexity of its chord gestures once present. */
  density: number;
  /** Performance gain applied after the authored chord velocity. */
  level: number;
  /** Maximum courses in a rhythm-lute chord. */
  maxCourses: 2 | 3;
  /** Delay from one rhythm-lute course attack to the next. */
  strumMs: number;
}

export const DEFAULT_MUSIC_RHYTHM_LUTE: Readonly<MusicRhythmLuteConfig> = Object.freeze({
  density: 0.38,
  level: 0.62,
  maxCourses: 3,
  strumMs: 18,
});

export function normalizeMusicRhythmLute(value: unknown): MusicRhythmLuteConfig {
  const candidate = typeof value === "object" && value !== null ? (value as Partial<MusicRhythmLuteConfig>) : {};
  return {
    density: clampedNumber(candidate.density, DEFAULT_MUSIC_RHYTHM_LUTE.density, 0, 1),
    level: clampedNumber(candidate.level, DEFAULT_MUSIC_RHYTHM_LUTE.level, 0, 1),
    maxCourses: candidate.maxCourses === 2 || candidate.maxCourses === 3 ? candidate.maxCourses : 3,
    strumMs: clampedNumber(candidate.strumMs, DEFAULT_MUSIC_RHYTHM_LUTE.strumMs, 0, 40),
  };
}

export function cloneMusicRhythmLute(config: Readonly<MusicRhythmLuteConfig>): MusicRhythmLuteConfig {
  return { ...config };
}
