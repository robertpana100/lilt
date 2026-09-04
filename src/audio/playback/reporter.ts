import type { MusicPiece } from "../composition/generator";
import type { MusicEffectsConfig } from "../synthesis/effects/config";
import { musicPieceSnapshot, type MusicRuntimePublisher } from "./runtime";
import type { MusicEngineConfig } from "./types";

export interface MusicReporterView {
  isEnabled(): boolean;
  hasPiece(): boolean;
  piece(): MusicPiece;
  pieceName(): string;
  config(): MusicEngineConfig;
  /** The rack the sounding take runs right now, listener overrides included. */
  soundingEffects(): MusicEffectsConfig;
}

/** Turns transport transitions into the immutable snapshot read by the UI. */
export class MusicStatusReporter {
  private pieceStarts = 0;

  constructor(
    private readonly runtime: MusicRuntimePublisher,
    private readonly view: MusicReporterView,
  ) {}

  error(): void {
    this.runtime.publish({ status: "error", sectionId: null });
  }

  stopped(): void {
    this.runtime.publish({ status: "stopped" });
  }

  complete(): void {
    if (this.runtime.peek()?.status === "complete") return;
    this.runtime.publish({ status: "complete", sectionId: null });
  }

  gap(): void {
    this.runtime.publish({ status: "gap", sectionId: null });
  }

  section(sectionId: string): void {
    this.runtime.publish({ status: "playing", sectionId });
  }

  /** A seek repositions the sounding take; it is not a new performance.
   * The position itself travels on the engine's own position channel. */
  sought(sectionId: string | null): void {
    this.runtime.publish({ status: "playing", sectionId });
  }

  /** Re-describe mutes without presenting them as a new performance. */
  renderingChanged(): void {
    if (this.runtime.peek() === null) return;
    this.runtime.publish(
      musicPieceSnapshot(this.view.piece(), this.view.pieceName(), this.view.config(), this.view.soundingEffects()),
    );
  }

  announcePiece(status: "playing" | "stopped"): void {
    if (!this.view.isEnabled() && !this.view.hasPiece() && this.runtime.peek() === null) {
      this.runtime.publish({ status, sectionId: null });
      return;
    }
    const piece = this.view.piece();
    const sounding = status === "playing";
    this.runtime.publish({
      status,
      sectionId: sounding ? (piece.sections[0]?.id ?? null) : null,
      ...(sounding ? { pieceStartNonce: ++this.pieceStarts } : {}),
      ...musicPieceSnapshot(piece, this.view.pieceName(), this.view.config(), this.view.soundingEffects()),
    });
  }
}
