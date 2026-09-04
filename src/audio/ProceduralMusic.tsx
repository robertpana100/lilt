import { useEffect } from "react";
import { getMusicApplication } from "./application";
import { getMusicSettings, useMusicSettings } from "./musicSettings";
import type { MusicPlaybackPort } from "./playback/port";
import { getSystemMediaSession, type SystemMediaSession } from "./system-media";

/**
 * Mirror the runtime to the operating system's media surface. On a
 * music-disabled boot no snapshot exists yet, and describing that silence to
 * the operating system would compose the opening piece for nothing; with
 * music enabled the snapshot is forced, because the engine is starting and
 * the opening piece is about to be needed anyway.
 */
function syncSystemMedia(media: SystemMediaSession, playback: MusicPlaybackPort, enabled: boolean): void {
  if (!enabled && playback.peekRuntimeSnapshot() === null) return;
  media.sync(playback.getRuntimeSnapshot(), enabled);
}

export function ProceduralMusic() {
  const settings = useMusicSettings();
  const application = getMusicApplication();
  const playback = application.playback;

  // What the operating system shows and controls. The session is a reporter and
  // a command surface; the engine below it stays the only owner of playback.
  useEffect(() => {
    const media = getSystemMediaSession();
    if (!media) return;
    const publish = () => syncSystemMedia(media, playback, getMusicSettings().enabled);
    media.attach();
    publish();
    const unsubscribe = playback.subscribeRuntime(publish);
    return () => {
      unsubscribe();
      media.detach();
    };
  }, [playback]);

  // Pausing changes no piece, so it publishes no runtime snapshot of its own.
  useEffect(() => {
    const media = getSystemMediaSession();
    if (media) syncSystemMedia(media, playback, settings.enabled);
  }, [playback, settings.enabled]);

  // The music session is the single owner of engine configuration, including
  // which root plays next; this host only owns browser lifecycle.
  useEffect(() => {
    const detachApplication = application.attach();
    const removeUnlockListeners = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    // A failed unlock (samples missing, fonts unreachable) must not turn every
    // click and keypress into a fresh activation pass with its own network
    // requests. One attempt runs at a time, and a failure holds further
    // gestures back briefly instead of hammering the same failing fetches.
    let unlockInFlight = false;
    let retryAfter = 0;
    const unlock = () => {
      if (!getMusicSettings().enabled) return;
      if (unlockInFlight || performance.now() < retryAfter) return;
      unlockInFlight = true;
      void application.unlock().then((audible) => {
        unlockInFlight = false;
        // Once the context is running, autoplay is unlocked for good and the
        // gesture listeners have nothing left to do.
        if (audible) removeUnlockListeners();
        else retryAfter = performance.now() + 5000;
      });
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      removeUnlockListeners();
      getSystemMediaSession()?.dispose();
      detachApplication();
    };
  }, [application]);

  return null;
}
