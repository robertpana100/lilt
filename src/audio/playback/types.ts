import type { MusicGeneratorConfig, MusicPiece } from "../composition/types";
import type { MusicPart } from "../composition/root-types";
import type { MusicRootId } from "../composition/roots";
import type { MusicLuteLineupEntry } from "../composition/lineup";
import type { MusicEffectsConfig } from "../synthesis/effects/config";

export interface MusicEngineConfig extends MusicGeneratorConfig {
  mutedParts: Readonly<Record<MusicPart, boolean>>;
  effects: Readonly<MusicEffectsConfig>;
}

export interface MusicRuntimeSnapshot {
  status: "stopped" | "playing" | "gap" | "complete" | "error";
  /** The piece now current, exactly as composed. */
  piece: MusicPiece;
  /** Who is playing the piece now current, part by part. */
  lineup: readonly MusicLuteLineupEntry[];
  /** The rack the sounding take actually runs, switches and amounts. */
  soundingEffects: MusicEffectsConfig;
  /** The root the sounding piece was composed from. */
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

export interface TavernMusicEngineOptions {
  initialConfig?: MusicEngineConfig;
  createAudioContext?: () => AudioContext | null;
  scheduleInterval?: (callback: () => void, delay: number) => ReturnType<typeof setInterval>;
  cancelInterval?: (handle: ReturnType<typeof setInterval>) => void;
  scheduleTimeout?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancelTimeout?: (handle: ReturnType<typeof setTimeout>) => void;
}
