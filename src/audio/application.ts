import { recordAudiblePieces, type ObservableMusicPlayback } from "./library/playback-observer";
import { getMusicSettings, subscribeMusicSettings, type MusicSettings } from "./musicSettings";
import { TavernMusicEngine } from "./playback/engine";
import type { MusicPlaybackPort } from "./playback/port";
import { MusicSession } from "./playback/session-controller";
import { createInitialMusicSessionState, type MusicSessionState } from "./playback/session-state";

export interface MusicApplicationOptions {
  initialState?: MusicSessionState;
  playback?: MusicPlaybackPort;
  getSettings?: () => MusicSettings;
  subscribeSettings?: (listener: () => void) => () => void;
  observePlayback?: (playback: ObservableMusicPlayback) => () => void;
  pick?: () => number;
  randomSeed?: () => number;
  scheduleTimeout?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancelTimeout?: (handle: ReturnType<typeof setTimeout>) => void;
}

/**
 * Application composition root for music. Construction only assembles owned
 * modules; browser listeners, history observation, and playback preferences
 * are attached explicitly for the lifetime of the mounted host.
 */
export class MusicApplication {
  readonly playback: MusicPlaybackPort;
  readonly session: MusicSession;

  private readonly getSettings: () => MusicSettings;
  private readonly subscribeSettings: (listener: () => void) => () => void;
  private readonly observePlayback: (playback: ObservableMusicPlayback) => () => void;
  private attachments = 0;
  private detachSettings: (() => void) | null = null;
  private detachHistory: (() => void) | null = null;

  constructor(options: MusicApplicationOptions = {}) {
    this.getSettings = options.getSettings ?? getMusicSettings;
    this.subscribeSettings = options.subscribeSettings ?? subscribeMusicSettings;
    this.observePlayback = options.observePlayback ?? recordAudiblePieces;
    const initialState =
      options.initialState ?? createInitialMusicSessionState({ pick: options.pick, randomSeed: options.randomSeed });
    this.playback = options.playback ?? new TavernMusicEngine({ initialConfig: initialState });
    this.session = new MusicSession(this.playback, initialState, {
      getControlMode: () => this.getSettings().controlMode,
      pick: options.pick,
      randomSeed: options.randomSeed,
      scheduleTimeout: options.scheduleTimeout,
      cancelTimeout: options.cancelTimeout,
    });
  }

  attach(): () => void {
    this.attachments += 1;
    if (this.attachments === 1) {
      this.session.start();
      this.detachHistory = this.observePlayback(this.playback);
      const applySettings = () => void this.applyPlaybackSettings(this.getSettings());
      this.detachSettings = this.subscribeSettings(applySettings);
      applySettings();
    }
    let attached = true;
    return () => {
      if (!attached) return;
      attached = false;
      this.detach();
    };
  }

  async unlock(): Promise<boolean> {
    const settings = this.getSettings();
    if (!settings.enabled) return false;
    await this.applyPlaybackSettings(settings);
    return this.playback.isAudible();
  }

  dispose(): void {
    this.attachments = 0;
    this.detachOwnedObservers();
    this.session.stop();
    this.playback.dispose();
  }

  private detach(): void {
    this.attachments = Math.max(0, this.attachments - 1);
    if (this.attachments > 0) return;
    this.detachOwnedObservers();
    this.session.stop();
    this.playback.dispose();
  }

  private async applyPlaybackSettings(settings: MusicSettings): Promise<void> {
    this.playback.setVolume(settings.volume);
    if (settings.enabled) await this.playback.start();
    else this.playback.stop();
  }

  private detachOwnedObservers(): void {
    this.detachSettings?.();
    this.detachSettings = null;
    this.detachHistory?.();
    this.detachHistory = null;
  }
}

let application: MusicApplication | null = null;

/** Lazily creates the browser application's single explicitly-owned runtime. */
export function getMusicApplication(): MusicApplication {
  application ??= new MusicApplication();
  return application;
}
