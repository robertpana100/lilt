import { useSyncExternalStore } from "react";
import { getMusicLibrary, subscribeMusicLibrary } from "./store";
import type { MusicLibrarySnapshot } from "./types";

const SERVER_LIBRARY: MusicLibrarySnapshot = Object.freeze({
  recent: [],
  favorites: [],
  persistenceError: null,
});

export function useMusicLibrary(): MusicLibrarySnapshot {
  return useSyncExternalStore(subscribeMusicLibrary, getMusicLibrary, () => SERVER_LIBRARY);
}
