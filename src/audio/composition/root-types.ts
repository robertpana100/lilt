import type { LuteStyleId } from "./lute";

export type MusicMode = "dorian" | "mixolydian" | "aeolian" | "phrygian";
export type MusicMeter = "2/4" | "3/4" | "6/8";
export type MusicPieceForm =
  "strophic" | "paired-puncta" | "refrain-verse" | "ballata" | "ostinato" | "through-composed";
/** Independently generated and mixed lute voices. */
export type MusicPart = "strings" | "rhythm";
export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]];

export interface WeightedMelodicInterval {
  /** Diatonic scale steps rather than semitones. */
  steps: number;
  weight: number;
}

export interface MusicCadencePattern {
  /** Absolute modal degrees; degree 0 and degree 7 are the final in adjacent octaves. */
  degrees: readonly number[];
  /** Integer durations on the 24-pulse quarter-note grid. */
  durations: readonly number[];
}

export interface MusicStyleProfile {
  melodicIntervals: readonly WeightedMelodicInterval[];
  startingDegrees: readonly number[];
  recitingDegrees: readonly number[];
  phraseBars: readonly number[];
  pickupPulses: readonly number[];
  rhythmCells: readonly (readonly number[])[];
  cadences: Readonly<Record<"open" | "closed" | "deceptive", readonly MusicCadencePattern[]>>;
  melodyRange: readonly [number, number];
  degreeRange: readonly [number, number];
  restChance: number;
}

/** How a root's second lute supports the lead. */
export type RhythmLuteTechnique = "chords" | "drone";

export interface MusicRoot {
  id: string;
  name: string;
  theme: string;
  mode: MusicMode;
  meter: MusicMeter;
  tempo: { min: number; default: number; max: number };
  safeTonics: readonly number[];
  forms: readonly MusicPieceForm[];
  style: MusicStyleProfile;
  luteStyle: LuteStyleId;
  rhythmLuteTechnique: RhythmLuteTechnique;
}
