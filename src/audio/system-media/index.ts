import { getMusicApplication } from "../application";
import { setMusicEnabled } from "../musicSettings";
import { createSystemMediaPresence } from "./presence";
import { SystemMediaSession } from "./session";
import type { SystemMediaCommands, SystemMediaHost } from "./types";

export { SystemMediaSession } from "./session";

/** The real `navigator.mediaSession`, or nothing where it is unavailable. */
function createBrowserSystemMediaHost(): SystemMediaHost | null {
  if (typeof navigator === "undefined") return null;
  const session = navigator.mediaSession as MediaSession | undefined;
  if (!session || typeof MediaMetadata === "undefined") return null;

  return {
    setTrack(track, artworkUrl) {
      if (!track) {
        session.metadata = null;
        return;
      }
      session.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: artworkUrl ? [{ src: artworkUrl, sizes: "512x512", type: "image/png" }] : [],
      });
    },
    setPlaybackState(state) {
      session.playbackState = state;
    },
    setPosition(position) {
      if (typeof session.setPositionState !== "function") return;
      try {
        session.setPositionState(
          position
            ? {
                duration: position.durationSeconds,
                position: position.positionSeconds,
                playbackRate: 1,
              }
            : undefined,
        );
      } catch {
        // A refused position leaves the surface without a progress bar, which is
        // not worth losing the rest of the metadata over.
      }
    },
    setActionHandler(action, handler) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // An action this browser does not know is one it will never ask for.
      }
    },
  };
}

/**
 * What the operating system may ask of Lilt. Pausing from Control Center is
 * the same act as pausing in the studio, so both go through the settings the
 * rest of the client reads.
 */
const systemMediaCommands: SystemMediaCommands = {
  play: () => setMusicEnabled(true),
  pause: () => setMusicEnabled(false),
  skip: () => getMusicApplication().session.randomize(),
};

let session: SystemMediaSession | null = null;
let unavailable = false;

/**
 * The client's single system media session, created on first use so that
 * importing the audio system does not reach for the DOM.
 */
export function getSystemMediaSession(): SystemMediaSession | null {
  if (session || unavailable) return session;
  const host = createBrowserSystemMediaHost();
  if (!host) {
    unavailable = true;
    return null;
  }
  session = new SystemMediaSession(host, createSystemMediaPresence(), systemMediaCommands);
  return session;
}
