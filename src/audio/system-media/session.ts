import type { MusicRuntimeSnapshot } from "../playback/types";
import { systemMediaIsSounding, systemMediaPlaybackState, systemMediaTrack, systemMediaTrackKey } from "./track";
import type {
  SystemMediaAction,
  SystemMediaCommands,
  SystemMediaHost,
  SystemMediaPlaybackState,
  SystemMediaPresence,
} from "./types";

const ACTIONS: readonly SystemMediaAction[] = ["play", "pause", "stop", "nexttrack"];

/**
 * Publishes the score to the operating system and turns what the operating
 * system asks back into the application's own music commands.
 *
 * It owns no playback of its own. The engine remains the only thing that decides
 * what sounds; this reports what is sounding and forwards a request to change it.
 */
export class SystemMediaSession {
  private attached = false;
  private publishedTrackKey: string | null = null;
  private publishedState: SystemMediaPlaybackState = "none";
  private artworkUrl: string | null = null;
  /** Whole seconds of finished playing stretches; excludes the current one. */
  private playedSeconds = 0;
  /** When the current playing stretch began, null while not playing. */
  private playingSince: number | null = null;
  private latest: { runtime: MusicRuntimeSnapshot; musicEnabled: boolean } | null = null;

  constructor(
    private readonly host: SystemMediaHost,
    private readonly presence: SystemMediaPresence,
    private readonly commands: SystemMediaCommands,
    private readonly now: () => number = () => Date.now(),
  ) {}

  attach(): void {
    if (this.attached) return;
    this.attached = true;
    for (const action of ACTIONS) {
      this.host.setActionHandler(action, () => this.handle(action));
    }
    if (this.latest) this.sync(this.latest.runtime, this.latest.musicEnabled);
  }

  /**
   * Give the operating system's surface back. Handlers are cleared before the
   * metadata so a key pressed during teardown cannot reach a detached session.
   */
  detach(): void {
    this.latest = null;
    if (!this.attached) return;
    this.attached = false;
    for (const action of ACTIONS) this.host.setActionHandler(action, null);
    this.host.setPlaybackState("none");
    this.host.setPosition(null);
    this.host.setTrack(null, null);
    this.publishedTrackKey = null;
    this.publishedState = "none";
    this.playedSeconds = 0;
    this.playingSince = null;
    this.presence.release();
  }

  dispose(): void {
    this.detach();
    this.presence.dispose();
  }

  /** Artwork is supplied by the platform, and may arrive after a piece has. */
  setArtwork(artworkUrl: string | null): void {
    if (this.artworkUrl === artworkUrl) return;
    this.artworkUrl = artworkUrl;
    if (!this.attached || !this.latest) return;
    this.host.setTrack(systemMediaTrack(this.latest.runtime), this.artworkUrl);
  }

  /** Report the state of playback. Publishing only what changed keeps a piece's
   * progress bar running instead of restarting it on every scheduler tick. */
  sync(runtime: MusicRuntimeSnapshot, musicEnabled: boolean): void {
    this.latest = { runtime, musicEnabled };
    if (!this.attached) return;

    const state = systemMediaPlaybackState(runtime.status, musicEnabled);
    if (musicEnabled && systemMediaIsSounding(runtime.status)) this.presence.claim();
    else this.presence.release();

    const trackKey = systemMediaTrackKey(runtime);
    const trackChanged = trackKey !== this.publishedTrackKey;
    if (trackChanged) {
      this.publishedTrackKey = trackKey;
      this.playedSeconds = 0;
      this.playingSince = state === "playing" ? this.now() : null;
      this.host.setTrack(systemMediaTrack(runtime), this.artworkUrl);
    }

    const stateChanged = state !== this.publishedState;
    if (stateChanged) {
      this.publishedState = state;
      // The score resumes from the pulse it paused at, so paused wall-clock
      // time must not count: bank the finished playing stretch on leaving
      // "playing" and re-anchor on returning to it.
      if (!trackChanged) {
        if (state === "playing") {
          this.playingSince ??= this.now();
        } else if (this.playingSince !== null) {
          this.playedSeconds += (this.now() - this.playingSince) / 1000;
          this.playingSince = null;
        }
      }
      this.host.setPlaybackState(state);
    }

    // A new piece starts its progress at nothing. A pause keeps showing the
    // elapsed time it stopped at, and a resume re-anchors it so the operating
    // system extrapolates from now.
    if (trackChanged) this.publishPosition(runtime, 0);
    else if (stateChanged) this.publishPosition(runtime, this.elapsedSeconds(runtime));
  }

  private elapsedSeconds(runtime: MusicRuntimeSnapshot): number {
    const playing = this.playingSince === null ? 0 : (this.now() - this.playingSince) / 1000;
    return Math.min(Math.max(0, this.playedSeconds + playing), runtime.durationSeconds);
  }

  private publishPosition(runtime: MusicRuntimeSnapshot, positionSeconds: number): void {
    if (!(runtime.durationSeconds > 0)) {
      this.host.setPosition(null);
      return;
    }
    this.host.setPosition({
      durationSeconds: runtime.durationSeconds,
      positionSeconds: Math.min(positionSeconds, runtime.durationSeconds),
    });
  }

  private handle(action: SystemMediaAction): void {
    if (!this.attached) return;
    switch (action) {
      case "play":
        this.commands.play();
        return;
      case "pause":
      case "stop":
        this.commands.pause();
        return;
      case "nexttrack":
        this.commands.skip();
    }
  }
}
