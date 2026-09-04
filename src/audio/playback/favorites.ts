import { getMusicApplication } from "../application";
import { getMusicLibrary, type MusicFavoriteEntry } from "../musicLibrary";
import type { MusicReplayTrack } from "./replay";
import {
  getMusicSettings,
  setMusicControlMode,
  setMusicEnabled,
  setMusicFavoritesOrder,
  type MusicSettings,
} from "../musicSettings";

type FavoriteOrder = MusicSettings["favoritesOrder"];

function shuffled(values: readonly string[], random: () => number): string[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    const current = result[index];
    const replacement = result[other];
    if (current === undefined || replacement === undefined) continue;
    result[index] = replacement;
    result[other] = current;
  }
  return result;
}

export class FavoritePlaybackQueue {
  private bag: string[] = [];
  private order: FavoriteOrder | null = null;

  constructor(private readonly random: () => number = Math.random) {}

  reset(currentTrackId: string | null, favorites: readonly MusicReplayTrack[], order: FavoriteOrder): void {
    this.order = order;
    this.bag = order === "shuffle" ? this.shuffleBag(favorites, currentTrackId) : [];
  }

  first(
    favorites: readonly MusicReplayTrack[],
    order: FavoriteOrder,
    requestedTrackId?: string,
  ): MusicReplayTrack | null {
    if (favorites.length === 0) return null;
    const [first] = favorites;
    if (!first) return null;
    const requested = requestedTrackId ? favorites.find((entry) => entry.id === requestedTrackId) : null;
    if (requested) {
      this.reset(requested.id, favorites, order);
      return requested;
    }
    if (order === "ordered") {
      this.reset(first.id, favorites, order);
      return first;
    }
    this.order = order;
    this.bag = this.shuffleBag(favorites, null);
    const id = this.bag.shift();
    return favorites.find((entry) => entry.id === id) ?? first;
  }

  next(
    favorites: readonly MusicReplayTrack[],
    order: FavoriteOrder,
    currentTrackId: string | null,
  ): MusicReplayTrack | null {
    if (favorites.length === 0) return null;
    const [first] = favorites;
    if (!first) return null;
    if (order === "ordered") {
      this.order = order;
      this.bag = [];
      const currentIndex = favorites.findIndex((entry) => entry.id === currentTrackId);
      return favorites[(currentIndex + 1 + favorites.length) % favorites.length] ?? first;
    }
    if (this.order !== order) this.reset(currentTrackId, favorites, order);
    const validIds = new Set(favorites.map((entry) => entry.id));
    this.bag = this.bag.filter((id) => validIds.has(id) && id !== currentTrackId);
    if (this.bag.length === 0) this.bag = this.shuffleBag(favorites, currentTrackId);
    const id = this.bag.shift();
    return favorites.find((entry) => entry.id === id) ?? first;
  }

  private shuffleBag(favorites: readonly MusicReplayTrack[], currentTrackId: string | null): string[] {
    const candidates = favorites.length > 1 ? favorites.filter((entry) => entry.id !== currentTrackId) : favorites;
    return shuffled(
      candidates.map((entry) => entry.id),
      this.random,
    );
  }
}

const playbackQueue = new FavoritePlaybackQueue();
let favoritesActive = false;

function favorites(): readonly MusicFavoriteEntry[] {
  return getMusicLibrary().favorites;
}

export function startFavoritesPlayback(requestedTrackId?: string): boolean {
  const entries = favorites();
  const settings = getMusicSettings();
  const first = playbackQueue.first(entries, settings.favoritesOrder, requestedTrackId);
  if (!first) {
    favoritesActive = false;
    if (settings.controlMode === "favorites") setMusicControlMode("auto");
    return false;
  }
  favoritesActive = true;
  setMusicControlMode("favorites");
  if (!settings.enabled) setMusicEnabled(true);
  getMusicApplication().session.playReplayTrack(first, {
    next: (currentTrackId) => playbackQueue.next(favorites(), getMusicSettings().favoritesOrder, currentTrackId),
    onComplete: () => {
      favoritesActive = false;
      if (getMusicSettings().controlMode === "favorites") setMusicControlMode("auto");
    },
  });
  return true;
}

export function ensureFavoritesPlayback(): boolean {
  return favoritesActive || startFavoritesPlayback();
}

export function stopFavoritesPlayback(): void {
  favoritesActive = false;
  getMusicApplication().session.clearReplaySequence();
}

export function setMusicDirection(controlMode: MusicSettings["controlMode"]): boolean {
  if (controlMode === "favorites") return startFavoritesPlayback();
  stopFavoritesPlayback();
  setMusicControlMode(controlMode);
  return true;
}

export function setFavoritePlaybackOrder(order: FavoriteOrder): void {
  setMusicFavoritesOrder(order);
}
