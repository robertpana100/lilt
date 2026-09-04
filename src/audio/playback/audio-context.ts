import { createMusicAudioGraph, MusicSynth } from "../synthesis/synth";
import type { MusicEffectsConfig } from "../synthesis/effects/config";
import type { MusicEffectRack } from "../synthesis/effects/rack";

export interface PieceActivationPlan {
  targetTime: number;
  fadeIn: boolean;
  replacePieceBus: boolean;
}

const PIECE_BUS_RELEASE_MS = 500;

export class MusicAudioContextOwner {
  context: AudioContext | null = null;
  master: GainNode | null = null;
  synth: MusicSynth | null = null;
  pieceBus: GainNode | null = null;

  private effectInput: GainNode | null = null;
  private effects: MusicEffectRack | null = null;
  /**
   * Set by fadeOut(): up to the scheduler lookahead of notes may still be
   * scheduled on the current piece bus, frozen by the pending suspend. A
   * resume must abandon that bus, or the stale tail plays on top of the
   * restarted transport.
   */
  private pieceBusStale = false;

  constructor(
    private readonly createAudioContext: () => AudioContext | null,
    private readonly scheduleTimeout: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>,
  ) {}

  ensureContext(effectConfig: Readonly<MusicEffectsConfig>): AudioContext | null {
    if (this.context) return this.context;
    const context = this.createAudioContext();
    if (!context) return null;
    const { master, input, effects } = createMusicAudioGraph(context, 0.0001, effectConfig);
    this.context = context;
    this.master = master;
    this.effectInput = input;
    this.effects = effects;
    this.synth = new MusicSynth(context, input);
    return context;
  }

  async prepareSynth(): Promise<void> {
    await this.synth?.prepare();
  }

  createPieceBus(startTime: number, fadeIn: boolean): void {
    const context = this.context;
    if (!context || !this.effectInput) return;
    const previous = this.pieceBus;
    if (previous) {
      previous.gain.cancelScheduledValues(context.currentTime);
      previous.gain.setTargetAtTime(0.0001, context.currentTime, 0.06);
      this.scheduleTimeout(() => previous.disconnect(), PIECE_BUS_RELEASE_MS);
    }
    const bus = context.createGain();
    bus.gain.setValueAtTime(fadeIn ? 0.0001 : 1, startTime);
    if (fadeIn) {
      bus.gain.exponentialRampToValueAtTime(1, startTime + 0.12);
    }
    bus.connect(this.effectInput);
    this.pieceBus = bus;
    this.pieceBusStale = false;
  }

  /** A bus left holding a stale tail forces a fresh, faded-in replacement. */
  planWithoutStaleTail(plan: PieceActivationPlan): PieceActivationPlan {
    return this.pieceBusStale ? { ...plan, fadeIn: true, replacePieceBus: true } : plan;
  }

  restoreMasterLevel(volume: number): void {
    const context = this.context;
    if (!context) return;
    this.master?.gain.cancelScheduledValues(context.currentTime);
    this.master?.gain.setTargetAtTime(volume, context.currentTime, 0.25);
  }

  setVolume(volume: number, enabled: boolean): void {
    if (!this.context || !this.master || !enabled) return;
    this.master.gain.setTargetAtTime(volume, this.context.currentTime, 0.08);
  }

  setEffects(effects: Readonly<MusicEffectsConfig>): void {
    this.effects?.update(effects);
  }

  fadeOut(): AudioContext | null {
    this.pieceBusStale = this.pieceBus !== null;
    if (!this.context || !this.master) return null;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.18);
    return this.context;
  }

  isRunning(): boolean {
    return this.context?.state === "running";
  }

  dispose(): void {
    const context = this.context;
    this.context = null;
    this.master = null;
    this.effectInput = null;
    this.effects?.dispose();
    this.effects = null;
    this.synth?.dispose();
    this.synth = null;
    this.pieceBus = null;
    this.pieceBusStale = false;
    if (context && context.state !== "closed") void context.close();
  }
}
