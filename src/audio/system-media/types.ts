import type { MusicTrackMetadata } from "../track-metadata";

/**
 * The contracts for showing the score in the operating system's own now-playing
 * surface: macOS Control Center, the Windows taskbar media flyout, and the
 * hardware media keys that drive both.
 *
 * Every seam the module touches is declared here so the behaviour can be tested
 * without a browser, an audio device, or an operating system.
 */

/** What the operating system displays while a piece is sounding. */
export type SystemMediaTrack = MusicTrackMetadata;

export type SystemMediaPlaybackState = "playing" | "paused" | "none";

/**
 * Only the actions the application can honour. A score that is generated a piece at a
 * time has no previous track, and its scheduler is not seekable, so neither is
 * offered to the operating system rather than being offered and ignored.
 */
export type SystemMediaAction = "play" | "pause" | "stop" | "nexttrack";

export interface SystemMediaPosition {
  durationSeconds: number;
  positionSeconds: number;
}

/** The browser surface this module needs, narrow enough to fake in a test. */
export interface SystemMediaHost {
  setTrack(track: SystemMediaTrack | null, artworkUrl: string | null): void;
  setPlaybackState(state: SystemMediaPlaybackState): void;
  setPosition(position: SystemMediaPosition | null): void;
  setActionHandler(action: SystemMediaAction, handler: (() => void) | null): void;
}

/**
 * The near-silent looping element that makes a Web Audio score visible to the
 * operating system at all. Chromium builds a media session around media
 * elements, not around an audio graph, so without an element playing there is
 * nothing for Control Center or the taskbar to show.
 */
export interface SystemMediaPresence {
  claim(): void;
  release(): void;
  dispose(): void;
}

/** What the operating system is allowed to ask the application to do. */
export interface SystemMediaCommands {
  play(): void;
  pause(): void;
  skip(): void;
}
