import { generateMusicPiece, type MusicGeneratorConfig, type MusicPiece } from "../composition/generator";
import type { MusicPart } from "../composition/roots";
import type { MusicRenderOptions } from "../synthesis/synth";
import { cloneMusicEffects, DEFAULT_MUSIC_EFFECTS, type MusicEffectsConfig } from "../synthesis/effects/config";
import { cloneMusicChords, DEFAULT_MUSIC_CHORDS } from "../composition/chord-config";
import { cloneMusicRhythmLute, DEFAULT_MUSIC_RHYTHM_LUTE } from "../composition/rhythm-lute-config";

export interface MusicReplayRecipe extends Omit<MusicGeneratorConfig, "autoAdvance"> {
  mutedParts: Readonly<Record<MusicPart, boolean>>;
  effects: Readonly<MusicEffectsConfig>;
}

export interface MusicReplayTrack {
  id: string;
  name: string;
  recipe: MusicReplayRecipe;
}

type ReplayConfig = MusicGeneratorConfig & {
  mutedParts: Readonly<Record<MusicPart, boolean>>;
  effects?: Readonly<MusicEffectsConfig>;
};

export function musicReplayTrackId(recipe: MusicReplayRecipe): string {
  const muted = Object.entries(recipe.mutedParts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([part, value]) => `${part}=${value ? 1 : 0}`)
    .join(",");
  return [
    recipe.rootId,
    recipe.bpm,
    recipe.masterSeed,
    recipe.pieceIndex,
    recipe.variationIndex,
    recipe.performanceIndex,
    recipe.novelty,
    JSON.stringify(recipe.chords),
    JSON.stringify(recipe.rhythmLute),
    recipe.humanization,
    JSON.stringify(recipe.effects),
    recipe.formOverride ?? "auto",
    recipe.tonicOverride ?? "auto",
    muted,
  ].join(":");
}

export function captureMusicReplayRecipe(config: ReplayConfig, piece: MusicPiece): MusicReplayRecipe {
  return {
    rootId: config.rootId,
    bpm: config.bpm,
    masterSeed: config.masterSeed,
    pieceIndex: piece.pieceIndex,
    variationIndex: config.variationIndex,
    performanceIndex: config.performanceIndex,
    novelty: config.novelty,
    chords: cloneMusicChords(config.chords ?? DEFAULT_MUSIC_CHORDS),
    rhythmLute: cloneMusicRhythmLute(config.rhythmLute ?? DEFAULT_MUSIC_RHYTHM_LUTE),
    humanization: config.humanization,
    formOverride: config.formOverride,
    tonicOverride: config.tonicOverride,
    mutedParts: { ...config.mutedParts },
    effects: cloneMusicEffects(config.effects ?? DEFAULT_MUSIC_EFFECTS),
  };
}

export function createMusicReplayTrack(name: string, recipe: MusicReplayRecipe): MusicReplayTrack {
  return { id: musicReplayTrackId(recipe), name, recipe };
}

export function generateReplayPiece(track: MusicReplayTrack): MusicPiece {
  return generateMusicPiece({ ...track.recipe, autoAdvance: false });
}

export function replayRenderOptions(track: MusicReplayTrack): MusicRenderOptions {
  return {
    humanization: track.recipe.humanization,
    chords: cloneMusicChords(track.recipe.chords),
    rhythmLute: cloneMusicRhythmLute(track.recipe.rhythmLute),
    mutedParts: { ...track.recipe.mutedParts },
    effects: cloneMusicEffects(track.recipe.effects),
  };
}
