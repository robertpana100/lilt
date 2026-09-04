import type { MusicPieceDirector } from "./program";
import type { MusicPlaybackPort } from "./port";
import type { MusicSessionState } from "./session-state";

export interface MusicSessionLifecycleOptions {
  scheduleTimeout?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancelTimeout?: (handle: ReturnType<typeof setTimeout>) => void;
}

/**
 * Owns the session's director attachment and debounced engine configuration.
 * Editable state and its transitions remain outside this lifecycle mechanism.
 */
export class MusicSessionLifecycle {
  private readonly scheduleTimeout: NonNullable<MusicSessionLifecycleOptions["scheduleTimeout"]>;
  private readonly cancelTimeout: NonNullable<MusicSessionLifecycleOptions["cancelTimeout"]>;
  private configureTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  constructor(
    private readonly playback: MusicPlaybackPort,
    options: MusicSessionLifecycleOptions = {},
  ) {
    this.scheduleTimeout = options.scheduleTimeout ?? ((callback, delay) => setTimeout(callback, delay));
    this.cancelTimeout = options.cancelTimeout ?? ((handle) => clearTimeout(handle));
  }

  start(snapshot: MusicSessionState, director: MusicPieceDirector): void {
    if (this.started) return;
    this.started = true;
    // A host may unmount while a debounced edit is pending. Stopping cancels
    // that timer; reattaching must therefore hand the latest snapshot over
    // before playback resumes.
    this.playback.configure(snapshot);
    this.playback.setPieceDirector(director);
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.cancelPendingConfiguration();
    this.playback.setPieceDirector(null);
  }

  configure(snapshot: MusicSessionState, debounce: boolean): void {
    this.cancelPendingConfiguration();
    if (debounce) {
      this.configureTimer = this.scheduleTimeout(() => {
        this.configureTimer = null;
        this.playback.configure(snapshot);
      }, 150);
      return;
    }
    this.playback.configure(snapshot);
  }

  cancelPendingConfiguration(): void {
    if (this.configureTimer !== null) this.cancelTimeout(this.configureTimer);
    this.configureTimer = null;
  }
}
