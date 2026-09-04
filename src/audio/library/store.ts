import type { MusicPiece } from "../composition/generator";
import { type MusicReplayRecipe, type MusicReplayTrack } from "../playback/replay";
import {
  composedLibraryPiece,
  EMPTY_MUSIC_LIBRARY,
  hydrateLibraryTrack,
  MAX_MUSIC_FAVORITES,
  MAX_MUSIC_HISTORY,
  normalizeMusicLibrary,
  persistedTrack,
  serializeMusicLibrary,
} from "./normalization";
import type { MusicHistoryEntry, MusicLibrarySnapshot } from "./types";

export { MAX_MUSIC_FAVORITES, MAX_MUSIC_HISTORY } from "./normalization";

export const MUSIC_LIBRARY_STORAGE_KEY = "lilt-music-library";
const musicLibraryListeners = new Set<() => void>();
let snapshot: MusicLibrarySnapshot | null = null;
let playSequence = 0;

function readLibrary(): MusicLibrarySnapshot {
  if (snapshot) return snapshot;
  if (typeof localStorage === "undefined") return EMPTY_MUSIC_LIBRARY;
  try {
    const raw = localStorage.getItem(MUSIC_LIBRARY_STORAGE_KEY);
    snapshot = raw === null ? EMPTY_MUSIC_LIBRARY : normalizeMusicLibrary(JSON.parse(raw));
  } catch {
    snapshot = {
      ...EMPTY_MUSIC_LIBRARY,
      persistenceError: "The music library could not be loaded. New changes will remain available for this session.",
    };
  }
  return snapshot;
}

function publish(next: MusicLibrarySnapshot): void {
  const writable = { ...next, persistenceError: null };
  snapshot = writable;
  try {
    localStorage.setItem(MUSIC_LIBRARY_STORAGE_KEY, serializeMusicLibrary(writable));
  } catch {
    snapshot = {
      ...writable,
      persistenceError: "The music library could not be saved. Check browser storage before closing Lilt.",
    };
  }
  musicLibraryListeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== MUSIC_LIBRARY_STORAGE_KEY) return;
  snapshot = null;
  readLibrary();
  musicLibraryListeners.forEach((listener) => listener());
}

export function subscribeMusicLibrary(listener: () => void): () => void {
  musicLibraryListeners.add(listener);
  if (musicLibraryListeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    musicLibraryListeners.delete(listener);
    if (musicLibraryListeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function getMusicLibrary(): MusicLibrarySnapshot {
  return readLibrary();
}

export function getMusicHistory(): readonly MusicHistoryEntry[] {
  return readLibrary().recent;
}

export function recordMusicPiecePlayed(
  piece: MusicPiece,
  recipe: MusicReplayRecipe,
  name: string,
  playedAt = Date.now(),
): void {
  const current = readLibrary();
  const track = hydrateLibraryTrack(
    {
      name,
      recipe: { ...recipe, pieceIndex: piece.pieceIndex },
    },
    piece,
  );
  const first = current.recent[0];
  const recent =
    first?.id === track.id
      ? [{ ...track, playId: first.playId, playedAt }, ...current.recent.slice(1)]
      : [
          {
            ...track,
            playId: `${track.id}:${playedAt}:${++playSequence}`,
            playedAt,
          },
          ...current.recent,
        ].slice(0, MAX_MUSIC_HISTORY);
  publish({ ...current, recent });
}

export type MusicFavoriteToggleResult = "added" | "removed" | "library-full";

export function toggleMusicFavorite(track: MusicReplayTrack, favoritedAt = Date.now()): MusicFavoriteToggleResult {
  const current = readLibrary();
  const exists = current.favorites.some((entry) => entry.id === track.id);
  if (exists) {
    publish({ ...current, favorites: current.favorites.filter((entry) => entry.id !== track.id) });
    return "removed";
  }
  // Favourites are kept takes; a full shelf refuses the new one instead of
  // silently destroying the oldest kept one.
  if (current.favorites.length >= MAX_MUSIC_FAVORITES) return "library-full";
  // Only a piece that has already been composed is worth carrying over:
  // composing a lazily hydrated row's score just to store name and recipe
  // would be wasted work.
  publish({
    ...current,
    favorites: [
      ...current.favorites,
      hydrateLibraryTrack(persistedTrack(track), composedLibraryPiece(track), { favoritedAt }),
    ],
  });
  return "added";
}

export function resetMusicLibraryForTests(): void {
  snapshot = EMPTY_MUSIC_LIBRARY;
  playSequence = 0;
  try {
    localStorage.removeItem(MUSIC_LIBRARY_STORAGE_KEY);
  } catch {
    // Tests without DOM storage still reset the in-memory snapshot.
  }
  musicLibraryListeners.forEach((listener) => listener());
}

export function reloadMusicLibraryForTests(): void {
  snapshot = null;
}
