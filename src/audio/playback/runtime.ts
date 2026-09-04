import type { MusicPiece } from "../composition/generator";
import { musicPieceLineup } from "../composition/lineup";
import { varyMusicEffects } from "../synthesis/effects/variation";
import type { MusicEffectsConfig } from "../synthesis/effects/config";
import type { MusicEngineConfig, MusicRuntimeSnapshot } from "./types";

type MusicPieceSnapshot = Pick<
  MusicRuntimeSnapshot,
  | "piece"
  | "lineup"
  | "soundingEffects"
  | "rootId"
  | "pieceIndex"
  | "compositionSeed"
  | "variationSeed"
  | "performanceSeed"
  | "form"
  | "tonicMidi"
  | "durationSeconds"
  | "gapSeconds"
  | "name"
>;

/**
 * The snapshot fields a piece determines, wherever that piece came from.
 *
 * The lineup needs the render options as well as the piece, because who plays a
 * part is an overrides-and-mutes question and only the config answers it.
 */
export function musicPieceSnapshot(
  piece: MusicPiece,
  name: string,
  config: MusicEngineConfig,
  soundingEffects: MusicEffectsConfig,
): MusicPieceSnapshot {
  return {
    piece,
    lineup: musicPieceLineup(piece, config.mutedParts),
    soundingEffects,
    rootId: piece.rootId,
    pieceIndex: piece.pieceIndex,
    compositionSeed: piece.compositionSeed,
    variationSeed: piece.variationSeed,
    performanceSeed: piece.performanceSeed,
    form: piece.form,
    tonicMidi: piece.tonicMidi,
    durationSeconds: piece.durationSeconds,
    gapSeconds: piece.gapSeconds,
    name,
  };
}

/**
 * Owns the snapshot the UI subscribes to. It publishes what it is given and
 * decides nothing itself; which status a piece is in belongs to the engine.
 */
export class MusicRuntimePublisher {
  private snapshot: MusicRuntimeSnapshot | null = null;
  /** Patches published before anything read the opening snapshot. */
  private pending: Partial<MusicRuntimeSnapshot> | null = null;
  private readonly listeners = new Set<() => void>();

  /**
   * The opening snapshot is built on first read rather than in the
   * constructor, so wiring up an engine at module load does not force the
   * opening piece to be composed before anything asks about it.
   */
  constructor(private readonly initial: () => { piece: MusicPiece; name: string; config: MusicEngineConfig }) {}

  get(): MusicRuntimeSnapshot {
    if (this.snapshot === null) {
      const { piece, name, config } = this.initial();
      const pending = this.pending;
      this.pending = null;
      this.snapshot = {
        status: "stopped",
        sectionId: piece.sections[0]?.id ?? null,
        ...musicPieceSnapshot(piece, name, config, varyMusicEffects(config.effects, piece.performanceSeed)),
        ...pending,
      };
    }
    return this.snapshot;
  }

  /** The snapshot if one has been materialized, without forcing one. */
  peek(): MusicRuntimeSnapshot | null {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Publishes a patch over the current snapshot. Before anything has read the
   * opening snapshot, a patch without a piece of its own (a stop on a
   * music-disabled boot, a loading announcement) is stashed rather than
   * merged, so publishing does not compose the opening piece just to patch
   * it; the stash is folded into the snapshot on the first genuine read. A
   * patch that carries a `piece` always comes from `musicPieceSnapshot`, so
   * it is complete enough to open on directly, composing nothing extra.
   */
  publish(patch: Partial<MusicRuntimeSnapshot>): void {
    if (this.snapshot !== null) {
      this.snapshot = { ...this.snapshot, ...patch };
    } else if (patch.piece === undefined) {
      this.pending = { ...this.pending, ...patch };
    } else {
      const pending = this.pending;
      this.pending = null;
      this.snapshot = {
        status: "stopped",
        sectionId: patch.piece.sections[0]?.id ?? null,
        ...pending,
        ...patch,
      } as MusicRuntimeSnapshot;
    }
    this.listeners.forEach((listener) => listener());
  }
}
