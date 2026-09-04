import { useSyncExternalStore } from "react";
import { getMusicApplication } from "../application";
import type { MusicSession } from "./session-controller";
import type { MusicSessionState } from "./session-state";
import type { MusicRuntimeSnapshot } from "./types";

export type { MusicSessionState } from "./session-state";

/** The application-owned controller used for imperative session commands. */
export function useMusicSessionController(): MusicSession {
  return getMusicApplication().session;
}

export function useMusicSession(): MusicSessionState {
  const session = useMusicSessionController();
  return useSyncExternalStore(session.subscribe, session.getState, session.getInitialState);
}

export function useMusicRuntime(): MusicRuntimeSnapshot {
  const session = useMusicSessionController();
  return useSyncExternalStore(session.subscribeRuntime, session.getRuntimeSnapshot, session.getRuntimeSnapshot);
}

/**
 * Coarse progress through the sounding take, in seconds. Position notices
 * travel on their own channel, so only the component reading progress
 * re-renders while a take plays.
 */
export function useMusicPosition(): number {
  const session = useMusicSessionController();
  return useSyncExternalStore(session.subscribePosition, session.getPositionSeconds);
}
