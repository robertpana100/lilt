import type { MusicPiece } from "../composition/types";
import type { MusicPieceDescription } from "../composition/generator";
import type { MusicReplayTrack } from "../playback/replay";
import type { MusicLuteLineupEntry } from "../composition/lineup";
import type { MusicRenderOptions } from "../synthesis/synth";

export interface MusicLibraryTrack extends MusicReplayTrack {
  rootName: string;
  theme: string;
  /**
   * The take's cheap identity: form, tempo, length, seeds, and tonic, known
   * without composing. Listing, searching, and cover art read this; only
   * play, export, and replay read `piece`.
   */
  description: MusicPieceDescription;
  /** Who plays this take, resolved through its saved overrides and mutes. */
  lineup: readonly MusicLuteLineupEntry[];
  /** The full composed score. Reading this on a hydrated track composes it. */
  piece: MusicPiece;
  renderOptions: MusicRenderOptions;
}

export interface MusicHistoryEntry extends MusicLibraryTrack {
  playId: string;
  playedAt: number;
}

export interface MusicFavoriteEntry extends MusicLibraryTrack {
  favoritedAt: number;
}

export interface MusicLibrarySnapshot {
  recent: readonly MusicHistoryEntry[];
  favorites: readonly MusicFavoriteEntry[];
  persistenceError: string | null;
}
