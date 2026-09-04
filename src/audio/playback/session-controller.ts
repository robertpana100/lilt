import type { MusicChordConfig } from "../composition/chord-config";
import type { MusicPart, MusicPieceForm, MusicRootId } from "../composition/roots";
import type { MusicRhythmLuteConfig } from "../composition/rhythm-lute-config";
import type { MusicSettings } from "../musicSettings";
import type { MusicEffectId, MusicEffectsConfig } from "../synthesis/effects/config";
import { directNextMusicPiece, nextMusicRoot } from "./direction";
import type { MusicConfigurationOptions, MusicPlaybackPort } from "./port";
import { MusicSessionLifecycle, type MusicSessionLifecycleOptions } from "./session-lifecycle";
import {
  cloneMusicSessionState,
  createBrowserRandomSeed,
  reduceMusicSessionState,
  updateMusicSessionEffect,
  type MusicSessionAction,
  type MusicSessionState,
} from "./session-state";
import type { MusicRuntimeSnapshot } from "./types";

export interface MusicSessionOptions extends MusicSessionLifecycleOptions {
  getControlMode: () => MusicSettings["controlMode"];
  pick?: () => number;
  randomSeed?: () => number;
}

/**
 * Owns editable repertoire state and session commands. State changes are pure
 * reducer calls; director attachment and debounced playback configuration are
 * delegated to the focused lifecycle controller.
 */
export class MusicSession {
  private readonly listeners = new Set<() => void>();
  private readonly initialState: MusicSessionState;
  private readonly getControlMode: () => MusicSettings["controlMode"];
  private readonly pick: () => number;
  private readonly randomSeed: () => number;
  private readonly lifecycle: MusicSessionLifecycle;
  private snapshot: MusicSessionState;

  constructor(
    private readonly playback: MusicPlaybackPort,
    initialState: MusicSessionState,
    options: MusicSessionOptions,
  ) {
    this.initialState = cloneMusicSessionState(initialState);
    this.snapshot = cloneMusicSessionState(initialState);
    this.getControlMode = options.getControlMode;
    this.pick = options.pick ?? Math.random;
    this.randomSeed = options.randomSeed ?? createBrowserRandomSeed;
    this.lifecycle = new MusicSessionLifecycle(playback, options);
  }

  start(): void {
    this.lifecycle.start(this.snapshot, this.directNextPiece);
  }

  stop(): void {
    this.lifecycle.stop();
  }

  getState = (): MusicSessionState => this.snapshot;

  getInitialState = (): MusicSessionState => this.initialState;

  getRuntimeSnapshot = (): MusicRuntimeSnapshot => this.playback.getRuntimeSnapshot();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  subscribeRuntime = (listener: () => void): (() => void) => this.playback.subscribeRuntime(listener);

  getPositionSeconds = (): number => this.playback.getPositionSeconds();

  subscribePosition = (listener: () => void): (() => void) => this.playback.subscribePosition(listener);

  setRoot(rootId: MusicRootId): void {
    this.update({ type: "set-root", rootId });
  }

  seek(positionSeconds: number): void {
    this.playback.seek(positionSeconds);
  }

  directNextPiece = (): MusicSessionState => {
    const next = directNextMusicPiece(this.snapshot, this.getControlMode(), this.pick);
    this.replaceSnapshot(next);
    return next;
  };

  setBpm(bpm: number): void {
    this.update({ type: "set-bpm", bpm, pieceIndex: this.currentPieceIndex() }, true);
  }

  setMasterSeed(masterSeed: number): void {
    this.update({ type: "set-master-seed", masterSeed });
  }

  newComposition(): void {
    this.publish(
      reduceMusicSessionState(this.snapshot, { type: "set-master-seed", masterSeed: this.randomSeed() }),
      false,
      { preserveEffects: true },
    );
  }

  newVariation(): void {
    this.update({ type: "new-variation", pieceIndex: this.currentPieceIndex() });
  }

  newPerformance(): void {
    this.update({ type: "new-performance", pieceIndex: this.currentPieceIndex() });
  }

  randomize(): void {
    const rootId = nextMusicRoot(this.snapshot.rootId, this.pick);
    this.update({ type: "randomize", rootId, masterSeed: this.randomSeed() });
  }

  setNovelty(novelty: number): void {
    this.update({ type: "set-novelty", novelty, pieceIndex: this.currentPieceIndex() }, true);
  }

  setChords(patch: Partial<MusicChordConfig>): void {
    this.update({ type: "set-chords", patch, pieceIndex: this.currentPieceIndex() }, true);
  }

  resetChords(): void {
    this.update({ type: "reset-chords", pieceIndex: this.currentPieceIndex() });
  }

  setRhythmLute(patch: Partial<MusicRhythmLuteConfig>): void {
    this.update({ type: "set-rhythm-lute", patch, pieceIndex: this.currentPieceIndex() }, true);
  }

  resetRhythmLute(): void {
    this.update({ type: "reset-rhythm-lute", pieceIndex: this.currentPieceIndex() });
  }

  setHumanization(humanization: number): void {
    this.update({ type: "set-humanization", humanization });
  }

  setFormOverride(formOverride: MusicPieceForm | null): void {
    this.update({ type: "set-form-override", formOverride, pieceIndex: this.currentPieceIndex() });
  }

  setTonicOverride(tonicOverride: number | null): void {
    this.update({ type: "set-tonic-override", tonicOverride, pieceIndex: this.currentPieceIndex() });
  }

  setAutoAdvance(autoAdvance: boolean): void {
    this.update({ type: "set-auto-advance", autoAdvance });
  }

  setPartMuted(part: MusicPart, muted: boolean): void {
    this.update({ type: "set-part-muted", part, muted });
  }

  setEffectsBypassed(bypassed: boolean): void {
    this.update({ type: "set-effects-bypassed", bypassed });
  }

  setEffect<Id extends MusicEffectId>(effect: Id, patch: Partial<MusicEffectsConfig[Id]>): void {
    this.publish(updateMusicSessionEffect(this.snapshot, effect, patch), false, { applyEffects: true });
  }

  resetEffects(): void {
    this.publish(reduceMusicSessionState(this.snapshot, { type: "reset-effects" }), false, { applyEffects: true });
  }

  reset(): void {
    this.publish(cloneMusicSessionState(this.initialState));
  }

  private currentPieceIndex(): number {
    return this.playback.getRuntimeSnapshot().pieceIndex;
  }

  private update(action: MusicSessionAction, debounce = false): void {
    this.publish(reduceMusicSessionState(this.snapshot, action), debounce);
  }

  private publish(next: MusicSessionState, debounce = false, options?: MusicConfigurationOptions): void {
    this.snapshot = next;
    this.lifecycle.configure(next, debounce, options);
    this.listeners.forEach((listener) => listener());
  }

  private replaceSnapshot(next: MusicSessionState): void {
    this.lifecycle.cancelPendingConfiguration();
    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }
}
