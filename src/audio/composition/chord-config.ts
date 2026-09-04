import { clampedNumber } from "../valueGuards";

export interface MusicChordConfig {
  /** Proportion of eligible structural notes that receive harmony. */
  amount: number;
  /** Maximum simultaneous lute courses in one score event. */
  maxCourses: 2 | 3;
  /** Delay from one course attack to the next. */
  strumMs: number;
}

export const DEFAULT_MUSIC_CHORDS: Readonly<MusicChordConfig> = Object.freeze({
  amount: 0.5,
  maxCourses: 3,
  strumMs: 11,
});

export function normalizeMusicChords(value: unknown): MusicChordConfig {
  const candidate = typeof value === "object" && value !== null ? (value as Partial<MusicChordConfig>) : {};
  return {
    amount: clampedNumber(candidate.amount, DEFAULT_MUSIC_CHORDS.amount, 0, 1),
    maxCourses: candidate.maxCourses === 2 || candidate.maxCourses === 3 ? candidate.maxCourses : 3,
    strumMs: clampedNumber(candidate.strumMs, DEFAULT_MUSIC_CHORDS.strumMs, 0, 40),
  };
}

export function cloneMusicChords(chords: Readonly<MusicChordConfig>): MusicChordConfig {
  return { ...chords };
}
