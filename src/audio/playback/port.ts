import type { MusicPieceDirector } from "./program";
import type { MusicReplayTrack } from "./replay";
import type { MusicEngineConfig, MusicReplaySequence, MusicRuntimeSnapshot } from "./types";

/**
 * The one application-facing playback port. `TavernMusicEngine` implements
 * it; sessions and lifecycle owners depend on this contract rather than
 * adding another method-for-method wrapper around the engine.
 */
export interface MusicPlaybackPort {
  start(): Promise<void>;
  stop(): void;
  setVolume(volume: number): void;
  configure(config: MusicEngineConfig): void;
  skipToNextPiece(): void;
  seek(positionSeconds: number): void;
  playReplayTrack(track: MusicReplayTrack, sequence?: MusicReplaySequence | null): void;
  clearReplaySequence(): void;
  setPieceDirector(director: MusicPieceDirector | null): void;
  subscribeRuntime(listener: () => void): () => void;
  getRuntimeSnapshot(): MusicRuntimeSnapshot;
  /** The snapshot if one has been materialized; null composes nothing. */
  peekRuntimeSnapshot(): MusicRuntimeSnapshot | null;
  /**
   * Coarse progress through the sounding take, on its own channel so the
   * runtime snapshot stays quiet between section transitions.
   */
  subscribePosition(listener: () => void): () => void;
  getPositionSeconds(): number;
  isAudible(): boolean;
  dispose(): void;
}
