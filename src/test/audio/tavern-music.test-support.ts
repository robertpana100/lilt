import {
  type MusicCourseEvent,
  type MusicGeneratorConfig,
  type MusicPiece,
  type MusicSection,
} from "@/audio/composition/generator";
import { NO_MUTED_PARTS, getMusicRoot, type MusicRootId } from "@/audio/composition/roots";
import { type MusicEngineConfig } from "@/audio/playback/engine";
import { DEFAULT_MUSIC_EFFECTS } from "@/audio/synthesis/effects/config";
import { DEFAULT_MUSIC_CHORDS } from "@/audio/composition/chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "@/audio/composition/rhythm-lute-config";

export function config(
  rootId: MusicRootId = "hearth",
  overrides: Partial<MusicGeneratorConfig> = {},
): MusicGeneratorConfig {
  const root = getMusicRoot(rootId);
  return {
    rootId,
    bpm: root.tempo.default,
    masterSeed: 42,
    pieceIndex: 0,
    variationIndex: 0,
    performanceIndex: 0,
    novelty: 0.5,
    chords: DEFAULT_MUSIC_CHORDS,
    rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
    humanization: 0.55,
    formOverride: null,
    tonicOverride: null,
    autoAdvance: true,
    ...overrides,
  };
}

export function engineConfig(rootId: MusicRootId = "hearth"): MusicEngineConfig {
  return { ...config(rootId), mutedParts: NO_MUTED_PARTS, effects: DEFAULT_MUSIC_EFFECTS };
}

export function withoutPerformance(piece: MusicPiece) {
  const { performanceSeed: _performanceSeed, ...composition } = piece;
  return composition;
}

export function courseEvents(piece: MusicPiece): MusicCourseEvent[] {
  return piece.events.filter((event): event is MusicCourseEvent => event.kind === "course" && event.part === "strings");
}

export function rhythmEvents(piece: MusicPiece): MusicCourseEvent[] {
  return piece.events.filter((event): event is MusicCourseEvent => event.kind === "course" && event.part === "rhythm");
}

export function sectionMelody(piece: MusicPiece, sectionIndex: number): MusicCourseEvent[] {
  const section = piece.sections[sectionIndex];
  if (!section) throw new Error(`Missing section ${sectionIndex}.`);
  return piece.events.filter(
    (event): event is MusicCourseEvent =>
      event.kind === "course" &&
      event.part === "strings" &&
      event.startPulse >= section.startPulse &&
      event.startPulse < section.startPulse + section.lengthPulses,
  );
}

export function eventsInSpan(
  piece: MusicPiece,
  part: "strings" | "rhythm",
  startPulse: number,
  endPulse: number,
): MusicCourseEvent[] {
  return piece.events.filter(
    (event): event is MusicCourseEvent =>
      event.kind === "course" && event.part === part && event.startPulse >= startPulse && event.startPulse < endPulse,
  );
}

/** The section's sounding body, excluding the bridged caesura bar. */
export function sectionSpanEnd(section: MusicSection): number {
  return section.startPulse + section.lengthPulses - section.bridgePulses;
}

/** Yields the scripted draws in order, then a benign 0.99 for the rest. */
export function scriptedRandom(draws: number[]): () => number {
  let index = 0;
  return () => (index < draws.length ? draws[index++]! : 0.99);
}
