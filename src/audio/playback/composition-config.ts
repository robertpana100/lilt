import type { MusicGeneratorConfig } from "../composition/generator";
import type { MusicEngineConfig } from "./types";

type CompositionField = Exclude<keyof MusicGeneratorConfig, "humanization" | "autoAdvance" | "chords" | "rhythmLute">;

const COMPOSITION_FIELD_SET: Record<CompositionField, true> = {
  rootId: true,
  bpm: true,
  masterSeed: true,
  pieceIndex: true,
  variationIndex: true,
  performanceIndex: true,
  novelty: true,
  formOverride: true,
  tonicOverride: true,
};

const COMPOSITION_FIELDS = Object.keys(COMPOSITION_FIELD_SET) as readonly CompositionField[];

export function musicCompositionKey(config: MusicEngineConfig): string {
  return [
    ...COMPOSITION_FIELDS.map((field) => String(config[field])),
    config.chords.amount,
    config.chords.maxCourses,
    config.rhythmLute.density,
    config.rhythmLute.maxCourses,
  ].join(":");
}
