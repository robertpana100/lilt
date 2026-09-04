import type { MusicRuntimeSnapshot } from "../playback/types";
import { musicTrackMetadata } from "../track-metadata";
import type { SystemMediaPlaybackState, SystemMediaTrack } from "./types";

/**
 * What the operating system is told about the piece now sounding. Pure: the
 * runtime snapshot and the root registry are the only inputs, so the same piece
 * always describes itself the same way.
 */
export function systemMediaTrack(runtime: MusicRuntimeSnapshot): SystemMediaTrack {
  return musicTrackMetadata(runtime);
}

/**
 * The identity of a take, for deciding whether the operating system is already
 * showing it. A piece is the same take when it is the same score played the same
 * way by the same lute voicing, so a reroll or mute change counts as new.
 */
export function systemMediaTrackKey(runtime: MusicRuntimeSnapshot): string {
  const voicing = runtime.lineup.map((entry) => `${entry.part}:${entry.style}:${entry.technique}`).join(",");
  return [
    runtime.compositionSeed,
    runtime.variationSeed,
    runtime.performanceSeed,
    runtime.pieceIndex,
    runtime.name,
    voicing,
  ].join("|");
}

/**
 * How the operating system should describe playback.
 *
 * The gap between pieces is still "playing": the score is running and the
 * player has not asked it to stop. Anything else with music
 * switched on is paused rather than absent, so the piece stays on screen with a
 * play button instead of disappearing from Control Center.
 */
export function systemMediaPlaybackState(
  status: MusicRuntimeSnapshot["status"],
  musicEnabled: boolean,
): SystemMediaPlaybackState {
  if (!musicEnabled) return "paused";
  switch (status) {
    case "playing":
    case "gap":
      return "playing";
    default:
      return "paused";
  }
}

/** Whether a status means audio is actually reaching the speakers. */
export function systemMediaIsSounding(status: MusicRuntimeSnapshot["status"]): boolean {
  return status === "playing" || status === "gap";
}
