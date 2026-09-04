import { getMusicRoot, NO_MUTED_PARTS } from "../composition/roots";
import { renderMusicEvent } from "../synthesis/event-renderer";
import { DEFAULT_MUSIC_EFFECTS, normalizeMusicEffects, type MusicEffectsConfig } from "../synthesis/effects/config";
import { varyMusicEffects } from "../synthesis/effects/variation";
import { MusicAudioContextOwner, type PieceActivationPlan } from "./audio-context";
import { musicCompositionKey } from "./composition-config";
import type { MusicConfigurationOptions, MusicPlaybackPort } from "./port";
import { MusicProgram, type MusicPieceDirector } from "./program";
import { MusicStatusReporter } from "./reporter";
import { MusicRuntimePublisher } from "./runtime";
import { MusicTransport } from "./transport";
import type { MusicEngineConfig, MusicRuntimeSnapshot, TavernMusicEngineOptions } from "./types";
import { DEFAULT_MUSIC_CHORDS } from "../composition/chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "../composition/rhythm-lute-config";
export type { MusicEngineConfig, TavernMusicEngineOptions } from "./types";

// The lookahead must cover throttled background-tab timers, which browsers
// clamp to one second or more; the short interval keeps foreground edits snappy.
const SCHEDULE_AHEAD_SECONDS = 1.8;
const SCHEDULER_INTERVAL_MS = 100;
// A restart's first events must give the render worker and the main-thread PCM
// relay time to beat their scheduled start, or the first chord re-enters late
// and fades in without its pluck attack.
const RESTART_LEAD_SECONDS = 0.3;

const DEFAULT_CONFIG: MusicEngineConfig = {
  rootId: "hearth",
  bpm: getMusicRoot("hearth").tempo.default,
  masterSeed: 1,
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
  mutedParts: NO_MUTED_PARTS,
  effects: DEFAULT_MUSIC_EFFECTS,
};

/**
 * Coordinates the pieces of live playback: the audio context and its buses, the
 * repertoire, the score clock, and the runtime snapshot the
 * UI reads. The mechanics of each live in their own module; what remains here
 * is the order in which they happen.
 */
export class TavernMusicEngine implements MusicPlaybackPort {
  private readonly audio: MusicAudioContextOwner;
  private readonly program: MusicProgram;
  private readonly runtime: MusicRuntimePublisher;
  private readonly reporter: MusicStatusReporter;
  /** The score clock. Exposed so tests can position playback directly. */
  readonly transport = new MusicTransport();

  private scheduler: ReturnType<typeof setInterval> | null = null;
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;
  private enabled = false;
  private volume = 0.35;
  /** The varied rack applied to the audio graph for the take now sounding. */
  private appliedRack: MusicEffectsConfig | null = null;
  /** The position handed to listeners last, for cadence control. */
  private reportedPosition = 0;
  /**
   * The position readers see between notices. Cached rather than computed on
   * read, because a store contract wants one stable value per notification.
   */
  private positionValue = 0;
  private readonly positionListeners = new Set<() => void>();

  private readonly scheduleInterval: (callback: () => void, delay: number) => ReturnType<typeof setInterval>;
  private readonly cancelInterval: (handle: ReturnType<typeof setInterval>) => void;
  private readonly scheduleTimeout: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  private readonly cancelTimeout: (handle: ReturnType<typeof setTimeout>) => void;

  /**
   * The program owns the configuration beside the piece composed from it, so
   * everything the engine renders and activates reads it from there.
   */
  private get config(): MusicEngineConfig {
    return this.program.config;
  }

  constructor(options: TavernMusicEngineOptions = {}) {
    const createAudioContext =
      options.createAudioContext ??
      (() => {
        if (typeof window === "undefined") return null;
        const AudioContextClass = window.AudioContext;
        return AudioContextClass ? new AudioContextClass() : null;
      });
    this.scheduleInterval = options.scheduleInterval ?? ((callback, delay) => setInterval(callback, delay));
    this.cancelInterval = options.cancelInterval ?? ((handle) => clearInterval(handle));
    this.scheduleTimeout = options.scheduleTimeout ?? ((callback, delay) => setTimeout(callback, delay));
    this.cancelTimeout = options.cancelTimeout ?? ((handle) => clearTimeout(handle));
    this.audio = new MusicAudioContextOwner(createAudioContext, this.scheduleTimeout);
    this.program = new MusicProgram(options.initialConfig ?? DEFAULT_CONFIG);
    this.runtime = new MusicRuntimePublisher(() => ({
      piece: this.program.piece,
      name: this.program.name,
      config: this.config,
    }));
    this.reporter = new MusicStatusReporter(this.runtime, {
      isEnabled: () => this.enabled,
      hasPiece: () => this.program.hasPiece,
      piece: () => this.program.piece,
      pieceName: () => this.program.name,
      config: () => this.config,
      soundingEffects: () => this.soundingRack(),
    });
  }

  async start(): Promise<void> {
    this.enabled = true;
    let context: AudioContext | null;
    try {
      // Creating an AudioContext can throw; callers fire start() without
      // awaiting it, so the failure must surface as an engine error rather
      // than an unhandled rejection.
      context = this.audio.ensureContext(this.config.effects);
    } catch {
      this.reporter.error();
      return;
    }
    if (!context) return;
    if (this.suspendTimer !== null) this.cancelTimeout(this.suspendTimer);
    this.suspendTimer = null;

    try {
      await context.resume();
      await this.audio.prepareSynth();
    } catch {
      if (this.enabled && this.audio.context === context) this.reporter.error();
      return;
    }
    if (!this.enabled || context.state !== "running") return;
    if (this.scheduler !== null) {
      this.audio.restoreMasterLevel(this.volume);
      return;
    }
    const plan = this.audio.planWithoutStaleTail({
      targetTime: context.currentTime + RESTART_LEAD_SECONDS,
      fadeIn: this.audio.pieceBus === null,
      replacePieceBus: this.audio.pieceBus === null,
    });
    this.beginPlaying(plan, context);
  }

  stop(): void {
    this.enabled = false;
    if (this.scheduler !== null) this.cancelInterval(this.scheduler);
    this.scheduler = null;
    this.reporter.stopped();
    const context = this.audio.fadeOut();
    if (!context) return;
    if (this.suspendTimer !== null) this.cancelTimeout(this.suspendTimer);
    this.suspendTimer = this.scheduleTimeout(() => {
      if (!this.enabled && context.state === "running") void context.suspend();
    }, 700);
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.audio.setVolume(this.volume, this.enabled);
  }

  configure(config: MusicEngineConfig, options: MusicConfigurationOptions = {}): void {
    const regenerate = musicCompositionKey(this.config) !== musicCompositionKey(config);
    if (!regenerate) {
      // A listener can enable an effect whose session default is already on
      // but whose generated switch is off. Reattachments carry no such intent.
      if (options.applyEffects || JSON.stringify(config.effects) !== JSON.stringify(this.config.effects)) {
        this.audio.setEffects(this.rackEffects(config.effects));
      }
      const reschedule =
        this.config.humanization !== config.humanization ||
        this.config.mutedParts.strings !== config.mutedParts.strings ||
        this.config.mutedParts.rhythm !== config.mutedParts.rhythm ||
        this.config.chords.strumMs !== config.chords.strumMs ||
        this.config.rhythmLute.level !== config.rhythmLute.level ||
        this.config.rhythmLute.strumMs !== config.rhythmLute.strumMs;
      if (!this.program.hasPiece) {
        this.program.adoptConfig(config);
        return;
      }
      this.program.adoptConfig(config);
      this.reporter.renderingChanged();
      if (this.enabled && reschedule) this.reactivate(false);
      return;
    }
    // A composition-key change rewrites the score itself — bpm included, since
    // tempo feeds the length target — so the piece deliberately restarts from
    // its first pulse rather than resuming mid-phrase inside a different
    // composition.
    const retainedEffects = options.preserveEffects ? this.soundingRack() : null;
    this.program.regenerate(config, config.pieceIndex);
    this.appliedRack = retainedEffects;
    this.transport.rewind();
    this.restartPiece();
  }

  /**
   * Leave the current piece for a newly directed generated piece. The authored gap is not
   * played, and the arriving piece crossfades over the one being left.
   *
   * An explicit skip asks for the next piece even when auto-advance is off, so
   * it advances the repertoire without turning that setting back on.
   */
  skipToNextPiece(): void {
    if (!this.enabled) return;
    const advance = this.program.advance("skip");
    if (advance.kind === "complete") {
      this.reporter.complete();
      return;
    }
    this.appliedRack = null;
    this.transport.rewind();
    this.restartPiece();
  }

  setPieceDirector(director: MusicPieceDirector | null): void {
    this.program.setDirector(director);
  }

  subscribeRuntime(listener: () => void): () => void {
    return this.runtime.subscribe(listener);
  }

  /**
   * Coarse progress through the sounding take, on its own channel: the
   * runtime snapshot stays quiet between section transitions, so only a
   * position reader re-renders while a take plays.
   */
  subscribePosition(listener: () => void): () => void {
    this.positionListeners.add(listener);
    return () => {
      this.positionListeners.delete(listener);
    };
  }

  /** Where the sounding take has reached, in seconds from its first pulse. */
  getPositionSeconds(): number {
    return this.positionValue;
  }

  getRuntimeSnapshot(): MusicRuntimeSnapshot {
    return this.runtime.get();
  }

  /** The runtime snapshot if one exists, without composing the opening piece. */
  peekRuntimeSnapshot(): MusicRuntimeSnapshot | null {
    return this.runtime.peek();
  }

  isAudible(): boolean {
    return this.enabled && this.audio.isRunning();
  }

  dispose(): void {
    this.stop();
    if (this.suspendTimer !== null) this.cancelTimeout(this.suspendTimer);
    this.suspendTimer = null;
    this.audio.dispose();
  }

  /** Announce a newly chosen piece, then put it on a fresh piece bus. */
  private restartPiece(): void {
    if (!this.enabled || !this.audio.context) {
      this.reporter.announcePiece(this.enabled ? "playing" : "stopped");
      return;
    }
    this.reactivate(true);
  }

  private reactivate(announce: boolean): void {
    const context = this.audio.context;
    if (!this.enabled || !context) {
      this.reporter.renderingChanged();
      return;
    }
    this.beginPlaying(
      { targetTime: context.currentTime + RESTART_LEAD_SECONDS, fadeIn: true, replacePieceBus: true },
      context,
      announce,
    );
  }

  private beginPlaying(plan: PieceActivationPlan, context: AudioContext, announce = true): void {
    const startTime = Math.max(plan.targetTime, context.currentTime + RESTART_LEAD_SECONDS);
    // The piece being activated is scheduled moments later; composing it here
    // only front-loads work this same call performs anyway.
    this.audio.setEffects(this.soundingRack());
    this.audio.restoreMasterLevel(this.volume);
    if (plan.replacePieceBus) this.audio.createPieceBus(startTime, plan.fadeIn);
    this.transport.startAt(startTime);
    if (this.transport.waitingForNextPiece) this.reporter.gap();
    else if (announce) this.reporter.announcePiece("playing");
    this.reportPosition(this.audiblePositionSeconds());
    this.schedule();
    if (this.scheduler === null) {
      this.scheduler = this.scheduleInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
    }
  }

  private schedule(): void {
    const context = this.audio.context;
    if (!context || context.state !== "running") return;
    while (this.transport.isDue(context.currentTime, SCHEDULE_AHEAD_SECONDS)) {
      if (this.transport.waitingForNextPiece) {
        // Whether or not a next piece exists, this tick is done: activation is
        // async, so a freshly started piece schedules on a later tick.
        this.startNextPiece(context);
        return;
      }
      const piece = this.program.piece;
      if (this.transport.hasReachedEnd(piece.totalPulses)) {
        if (!this.config.autoAdvance) {
          this.reporter.complete();
          return;
        }
        this.transport.beginGap(piece.gapSeconds);
        this.reporter.gap();
        continue;
      }
      const section = this.program.sectionAt(this.transport.pulse);
      if (section) this.reporter.section(section.id);
      for (const { event, index } of this.program.eventsAt(this.transport.pulse)) {
        if (this.audio.synth) {
          renderMusicEvent(this.audio.synth, piece, event, index, this.config, this.audio.pieceBus, {
            eventTime: this.transport.nextPulseTime,
            minTime: context.currentTime,
          });
        }
      }
      this.transport.advance(piece.pulseSeconds);
    }
    this.reportProgress();
  }

  /** Publish the audible position at a coarse cadence, not once per pulse. */
  private reportProgress(): void {
    const position = this.audiblePositionSeconds();
    if (Math.abs(position - this.reportedPosition) >= 0.25) this.reportPosition(position);
  }

  /** Hand a fresh position to the store's readers and re-arm its cadence. */
  private reportPosition(position: number): void {
    this.positionValue = position;
    this.reportedPosition = position;
    this.positionListeners.forEach((listener) => listener());
  }

  /**
   * Continue the sounding take from `positionSeconds` into it. Already
   * scheduled audio is dropped with the piece bus it was routed through, the
   * score clock jumps to the enclosing pulse, and scheduling continues from
   * there — deterministically, since every event renders from its own pulse.
   * A seek repositions the take; it never presents it as a new performance.
   */
  seek(positionSeconds: number): void {
    const context = this.audio.context;
    if (!this.enabled || !context || this.scheduler === null) return;
    const piece = this.program.piece;
    const pulse = Math.max(
      0,
      Math.min(piece.totalPulses - 1, Math.floor(Math.max(0, positionSeconds) / piece.pulseSeconds)),
    );
    const startTime = context.currentTime + RESTART_LEAD_SECONDS;
    const plan = this.audio.planWithoutStaleTail({
      targetTime: startTime,
      fadeIn: false,
      replacePieceBus: true,
    });
    if (plan.replacePieceBus) this.audio.createPieceBus(Math.max(plan.targetTime, startTime), plan.fadeIn);
    this.transport.seekTo(pulse, Math.max(plan.targetTime, startTime));
    this.reportPosition(pulse * piece.pulseSeconds);
    this.reporter.sought(this.program.sectionContaining(pulse)?.id ?? null);
    this.schedule();
  }

  /**
   * Where the sounding take has actually reached. The scheduler works up to
   * `SCHEDULE_AHEAD_SECONDS` ahead of the wall clock, so the pulse counter
   * alone would run early; the anchor time corrects it. A take waiting out
   * its gap has finished: it holds its written end until the next piece
   * begins, and the gap's silence is not rewound through it.
   */
  private audiblePositionSeconds(): number {
    const piece = this.program.piece;
    if (this.transport.waitingForNextPiece) return piece.durationSeconds;
    const context = this.audio.context;
    const scheduled = this.transport.pulse * piece.pulseSeconds;
    if (!context || this.scheduler === null) return Math.min(scheduled, piece.durationSeconds);
    const ahead = Math.max(0, this.transport.nextPulseTime - context.currentTime);
    return Math.max(0, Math.min(scheduled - ahead, piece.durationSeconds));
  }

  private startNextPiece(context: AudioContext): void {
    const advance = this.program.advance("auto");
    if (advance.kind === "complete") {
      this.reporter.complete();
      return;
    }
    this.appliedRack = null;
    this.transport.rewind();
    this.beginPlaying(
      {
        targetTime: this.transport.nextPulseTime,
        fadeIn: false,
        replacePieceBus: true,
      },
      context,
    );
  }

  /**
   * The settings the rack runs: the session's effects varied around the current
   * piece's performance seed, so every generated take gets its own room while
   * the stored settings stay exactly what the listener set. Once a take is
   * sounding, its switches come from the listener — an edit is audible
   * immediately and lasts until the next piece redraws the coin. Without a
   * piece — configuring before anything plays — there is nothing to vary from.
   */
  private rackEffects(base: Readonly<MusicEffectsConfig>): MusicEffectsConfig {
    if (!this.program.hasPiece) return normalizeMusicEffects(base);
    this.appliedRack = varyMusicEffects(base, this.program.piece.performanceSeed, { switches: "listener" });
    return this.appliedRack;
  }

  /** Choose once per piece, then retain the rack through restarts and resumes. */
  private soundingRack(): MusicEffectsConfig {
    return (this.appliedRack ??= varyMusicEffects(this.config.effects, this.program.piece.performanceSeed));
  }
}
