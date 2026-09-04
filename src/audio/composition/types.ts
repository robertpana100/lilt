import type { MusicMode, MusicPart, MusicPieceForm, MusicRoot, MusicRootId } from "./roots";
import type { MusicChordConfig } from "./chord-config";
import type { MusicRhythmLuteConfig } from "./rhythm-lute-config";

export type MusicCadence = "open" | "closed" | "deceptive";
export type PhraseTransform =
  "identity" | "sequence-up" | "sequence-down" | "answer" | "ornament" | "rhythmic-variation";
export type MusicArticulation = "normal" | "accent" | "legato" | "ornament";

export interface MusicGeneratorConfig {
  rootId: MusicRootId;
  bpm: number;
  masterSeed: number;
  pieceIndex: number;
  variationIndex: number;
  performanceIndex: number;
  novelty: number;
  chords: Readonly<MusicChordConfig>;
  rhythmLute: Readonly<MusicRhythmLuteConfig>;
  humanization: number;
  formOverride: MusicPieceForm | null;
  tonicOverride: number | null;
  autoAdvance: boolean;
}

interface MusicEventBase {
  startPulse: number;
  durationPulses: number;
  velocity: number;
  articulation: MusicArticulation;
}

export interface MusicCourseEvent extends MusicEventBase {
  kind: "course";
  part: "strings" | "rhythm";
  pitches: readonly [number, ...number[]];
}

export type MusicEvent = MusicCourseEvent;

/**
 * A section's job in the song's arrangement. Verse sections carry the lead
 * lute alone (or over the drone roots' quiet drone); refrain and postlude
 * sections add the second lute's strumming; prelude and interlude sections
 * belong to the second lute alone, the instrumental frame around the song.
 */
export type MusicSectionRole = "prelude" | "verse" | "refrain" | "interlude" | "postlude";

export interface MusicSection {
  id: string;
  phraseId: string;
  label: string;
  role: MusicSectionRole;
  occurrence: number;
  startPulse: number;
  lengthPulses: number;
  /** Melody bars; a bridged section's lengthPulses adds the caesura bar. */
  bars: number;
  cadence: MusicCadence;
  transform: PhraseTransform;
  /** The trailing caesura bar the second lute sustains while the lead rests. */
  bridgePulses: number;
  activeParts: readonly MusicPart[];
}

export interface MusicPhraseNote {
  offsetPulse: number;
  durationPulses: number;
  degree: number;
}

export interface MusicPhrase {
  id: string;
  bars: number;
  pickupPulses: number;
  body: readonly MusicPhraseNote[];
}

export interface MusicPiece {
  rootId: MusicRootId;
  pieceIndex: number;
  compositionSeed: number;
  variationSeed: number;
  performanceSeed: number;
  tonicMidi: number;
  mode: MusicMode;
  meter: MusicRoot["meter"];
  form: MusicPieceForm;
  bpm: number;
  pulseSeconds: number;
  sections: readonly MusicSection[];
  events: readonly MusicEvent[];
  phrases: readonly MusicPhrase[];
  totalPulses: number;
  durationSeconds: number;
  gapSeconds: number;
}

export interface PerformanceVariation {
  startOffsetSeconds: number;
  durationScale: number;
  velocityScale: number;
}
