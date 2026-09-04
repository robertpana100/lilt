import { generateMusicPiece, generateNextMusicPiece, type MusicEvent, type MusicPiece } from "../composition/generator";
import { nameMusicPiece } from "../composition/names";
import { generateReplayPiece, type MusicReplayTrack } from "./replay";
import { indexMusicEvents, type IndexedMusicEvents } from "./transport";
import type { MusicEngineConfig, MusicReplaySequence } from "./types";

/**
 * What follows the piece that just finished. Whatever it is, the program has
 * already adopted its configuration; `config` reads it.
 */
export type MusicProgramAdvance =
  /** The generator produced the next piece. */
  | { kind: "piece" }
  /** A saved take was loaded. */
  | { kind: "replay" }
  /** Nothing follows; the sequence's completion callback, if it had one. */
  | { kind: "complete"; onComplete: (() => void) | undefined };

/**
 * Chooses the configuration each newly generated piece is composed from, which
 * is how the repertoire wanders between roots. Returning the config it was
 * given keeps the current one.
 */
export type MusicPieceDirector = (config: MusicEngineConfig) => MusicEngineConfig;

const KEEP_CONFIG: MusicPieceDirector = (config) => config;

/**
 * The repertoire. It owns the current configuration and which piece is
 * current — every transition that changes what plays swaps them together, so
 * the score and the config it was composed from cannot drift apart — plus the
 * piece's events indexed by pulse, and the decision about what plays next,
 * whether that comes from the generator or from a saved replay sequence.
 */
export class MusicProgram {
  private currentConfig: MusicEngineConfig;
  private currentPiece: MusicPiece | null = null;
  private events: IndexedMusicEvents | null = null;
  private sectionStarts: Map<number, MusicPiece["sections"][number]> | null = null;
  private index: number;
  private sequence: MusicReplaySequence | null = null;
  private trackId: string | null = null;
  private trackName: string | null = null;
  private director: MusicPieceDirector = KEEP_CONFIG;

  /**
   * The opening piece is composed on first read, not here: the config an
   * engine is constructed with is usually replaced immediately by the
   * session's, and composing it eagerly would be thrown-away work at startup.
   */
  constructor(initialConfig: MusicEngineConfig) {
    this.currentConfig = initialConfig;
    this.index = initialConfig.pieceIndex;
  }

  /** The configuration the current piece is composed and rendered from. */
  get config(): MusicEngineConfig {
    return this.currentConfig;
  }

  /** Whether a piece has been composed, without composing one to answer. */
  get hasPiece(): boolean {
    return this.currentPiece !== null;
  }

  get piece(): MusicPiece {
    if (this.currentPiece === null) this.setPiece(generateMusicPiece(this.currentConfig));
    return this.currentPiece as MusicPiece;
  }

  get pieceIndex(): number {
    return this.index;
  }

  /** A saved take keeps the name it was saved under; anything else is named. */
  get name(): string {
    return this.trackName ?? nameMusicPiece(this.piece);
  }

  get isReplaying(): boolean {
    return this.sequence !== null;
  }

  eventsAt(pulse: number): Array<{ event: MusicEvent; index: number }> {
    if (this.events === null) void this.piece;
    return (this.events as IndexedMusicEvents).get(pulse) ?? [];
  }

  /**
   * The section that starts on this pulse, if any. Indexed like the events,
   * because the scheduler asks once per pulse and only ~20 pulses in a piece
   * answer yes — a per-pulse scan of the section list paid for every miss.
   */
  sectionAt(pulse: number): MusicPiece["sections"][number] | null {
    if (this.sectionStarts === null) void this.piece;
    return this.sectionStarts?.get(pulse) ?? null;
  }

  /** The section a pulse falls inside, not merely the one it starts. */
  sectionContaining(pulse: number): MusicPiece["sections"][number] | null {
    let containing: MusicPiece["sections"][number] | null = null;
    for (const section of this.piece.sections) {
      if (section.startPulse <= pulse) containing = section;
      else break;
    }
    return containing;
  }

  /**
   * Same score, new rendering: adopt the config without touching the piece.
   * The caller vouches that the composition identity is unchanged; anything
   * that composes differently must go through `regenerate` instead.
   */
  adoptConfig(config: MusicEngineConfig): void {
    this.currentConfig = config;
  }

  /**
   * Compose a fresh piece at the given index, leaving any replay behind.
   * Before anything has read a piece the composition is deferred to the first
   * read, preserving the constructor's laziness across reconfigurations.
   */
  regenerate(config: MusicEngineConfig, pieceIndex: number): void {
    this.trackId = null;
    this.trackName = null;
    this.index = pieceIndex;
    this.currentConfig = { ...config, pieceIndex };
    if (this.currentPiece !== null) this.setPiece(generateMusicPiece(this.currentConfig));
  }

  setReplaySequence(sequence: MusicReplaySequence | null): void {
    this.sequence = sequence;
  }

  setDirector(director: MusicPieceDirector | null): void {
    this.director = director ?? KEEP_CONFIG;
  }

  /** Drop the sequence and the identity of the take that was playing. */
  clearReplay(): void {
    this.sequence = null;
    this.trackId = null;
    this.trackName = null;
  }

  /**
   * Drop the replay and hand back its completion callback. A reconfiguration
   * that replaces the score ends the sequence just as finishing it would, so
   * whoever queued it (favourites) must be told it is over.
   */
  endReplay(): (() => void) | undefined {
    const onComplete = this.sequence?.onComplete;
    this.clearReplay();
    return onComplete;
  }

  /** Loads a saved take and adopts the config it was recorded with. */
  loadReplayTrack(track: MusicReplayTrack): void {
    this.setPiece(generateReplayPiece(track));
    this.index = this.piece.pieceIndex;
    this.trackId = track.id;
    this.trackName = track.name;
    // A lone take must not roll on into the generated repertoire.
    this.currentConfig = { ...track.recipe, autoAdvance: this.sequence !== null };
  }

  /**
   * Leave the current piece for whatever follows it. A scheduled advance
   * honors auto-advance; an explicit skip asks for the next piece even when
   * auto-advance is off, without turning that setting back on for the
   * generated piece it lands on.
   */
  advance(intent: "auto" | "skip"): MusicProgramAdvance {
    if (this.sequence) {
      const nextTrack = this.sequence.next(this.trackId);
      if (nextTrack) {
        this.loadReplayTrack(nextTrack);
        return { kind: "replay" };
      }
      const { onComplete } = this.sequence;
      this.sequence = null;
      return { kind: "complete", onComplete };
    }
    const requested = intent === "skip" ? { ...this.currentConfig, autoAdvance: true } : this.currentConfig;
    if (!requested.autoAdvance) return { kind: "complete", onComplete: undefined };
    // Asked before the generator runs, and only when a piece will actually
    // follow: a director changes what is playing, so it must not fire on a
    // scheduler tick that turns out to have nothing left to play.
    const directed = this.director(requested);
    // A director may rebuild its answer from its own source of truth rather
    // than from the config passed in, losing the auto-advance a skip forced on.
    // The skip's promise — a next piece even with auto-advance off — is this
    // method's to keep, so it is restored before the generator asks.
    const composed = intent === "skip" ? { ...directed, autoAdvance: true } : directed;
    const nextPiece = generateNextMusicPiece(composed, this.index);
    if (!nextPiece) return { kind: "complete", onComplete: undefined };
    this.index = nextPiece.pieceIndex;
    // A generated piece must not inherit the true an explicit skip passed in.
    this.currentConfig = intent === "skip" ? { ...directed, autoAdvance: this.currentConfig.autoAdvance } : directed;
    this.setPiece(nextPiece);
    return { kind: "piece" };
  }

  private setPiece(piece: MusicPiece): void {
    this.currentPiece = piece;
    this.events = indexMusicEvents(piece);
    this.sectionStarts = new Map(piece.sections.map((section) => [section.startPulse, section]));
  }
}
