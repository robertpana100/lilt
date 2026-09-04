import type { MusicGeneratorConfig, MusicPiece } from "../composition/types";
import type { MusicPart } from "../composition/root-types";
import type { MusicRootId } from "../composition/roots";
import type { MusicReplayRecipe, MusicReplayTrack } from "./replay";
import type { MusicLuteLineupEntry } from "../composition/lineup";
import type { MusicEffectsConfig } from "../synthesis/effects/config";

export interface MusicEngineConfig extends MusicGeneratorConfig {
  mutedParts: Readonly<Record<MusicPart, boolean>>;
  effects: Readonly<MusicEffectsConfig>;
}

export interface MusicRuntimeSnapshot {
  status: "stopped" | "playing" | "gap" | "complete" | "error";
  /**
   * Increments each time the engine announces a piece as sounding. Consumers
   * that react to piece starts, like play history, watch this instead of
   * diffing musical fields, so section changes and rendering updates
   * cannot pass for a new piece.
   */
  pieceStartNonce: number;
  /** The piece now current, exactly as composed. */
  piece: MusicPiece;
  /** Everything needed to regenerate and re-render the current piece. */
  recipe: MusicReplayRecipe;
  /** Who is playing the piece now current, part by part. */
  lineup: readonly MusicLuteLineupEntry[];
  /** The rack the sounding take actually runs, switches and amounts. */
  soundingEffects: MusicEffectsConfig;
  /** The root the sounding piece was composed from, saved take or not. */
  rootId: MusicRootId;
  pieceIndex: number;
  compositionSeed: number;
  variationSeed: number;
  performanceSeed: number;
  sectionId: string | null;
  form: MusicPiece["form"];
  tonicMidi: number;
  durationSeconds: number;
  gapSeconds: number;
  name: string;
}

export interface MusicReplaySequence {
  next: (currentTrackId: string | null) => MusicReplayTrack | null;
  onComplete?: () => void;
}

export interface TavernMusicEngineOptions {
  initialConfig?: MusicEngineConfig;
  createAudioContext?: () => AudioContext | null;
  scheduleInterval?: (callback: () => void, delay: number) => ReturnType<typeof setInterval>;
  cancelInterval?: (handle: ReturnType<typeof setInterval>) => void;
  scheduleTimeout?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancelTimeout?: (handle: ReturnType<typeof setTimeout>) => void;
}
