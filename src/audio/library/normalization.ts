import {
  describeMusicPiece,
  generateMusicPiece,
  musicPieceDescription,
  type MusicPiece,
} from "../composition/generator";
import { musicPartsLineup } from "../composition/lineup";
import {
  createMusicReplayTrack,
  musicReplayTrackId,
  replayRenderOptions,
  type MusicReplayRecipe,
  type MusicReplayTrack,
} from "../playback/replay";
import {
  getMusicRoot,
  MUSIC_FORM_LABELS,
  MUSIC_PARTS,
  MUSIC_ROOTS,
  NO_MUTED_PARTS,
  type MusicPart,
  type MusicPieceForm,
  type MusicRootId,
} from "../composition/roots";
import type { MusicFavoriteEntry, MusicHistoryEntry, MusicLibrarySnapshot, MusicLibraryTrack } from "./types";
import { normalizeMusicEffects } from "../synthesis/effects/config";
import { normalizeMusicChords } from "../composition/chord-config";
import { normalizeMusicRhythmLute } from "../composition/rhythm-lute-config";
import { clampedNumber, finiteNumber } from "../valueGuards";

export const MAX_MUSIC_HISTORY = 25;
export const MAX_MUSIC_FAVORITES = 100;
export const EMPTY_MUSIC_LIBRARY: MusicLibrarySnapshot = Object.freeze({
  recent: [],
  favorites: [],
  persistenceError: null,
});

export interface PersistedTrack {
  name: string;
  recipe: MusicReplayRecipe;
}

interface PersistedMusicLibrary {
  recent: Array<{
    playId: string;
    playedAt: number;
    track: PersistedTrack;
  }>;
  favorites: Array<{
    favoritedAt: number;
    track: PersistedTrack;
  }>;
}

const validRootIds = new Set<MusicRootId>(MUSIC_ROOTS.map((root) => root.id));

function unsignedInteger(value: unknown, fallback: number): number {
  return Math.max(0, Math.floor(finiteNumber(value, fallback))) >>> 0;
}

function normalizeRecipe(value: unknown): MusicReplayRecipe | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Partial<Record<keyof MusicReplayRecipe, unknown>>;
  if (typeof candidate.rootId !== "string" || !validRootIds.has(candidate.rootId as MusicRootId)) return null;
  const rootId = candidate.rootId as MusicRootId;
  const root = getMusicRoot(rootId);
  const formOverride =
    typeof candidate.formOverride === "string" && root.forms.includes(candidate.formOverride as MusicPieceForm)
      ? (candidate.formOverride as MusicPieceForm)
      : null;
  const tonicCandidate = finiteNumber(candidate.tonicOverride, Number.NaN);
  const tonicOverride =
    Number.isFinite(tonicCandidate) && root.safeTonics.includes(tonicCandidate) ? tonicCandidate : null;
  const mutedParts = { ...NO_MUTED_PARTS };
  if (typeof candidate.mutedParts === "object" && candidate.mutedParts !== null) {
    const stored = candidate.mutedParts as Partial<Record<MusicPart, unknown>>;
    for (const part of MUSIC_PARTS) {
      if (typeof stored[part] === "boolean") {
        mutedParts[part] = stored[part];
      }
    }
  }
  return {
    rootId,
    bpm: Math.round(clampedNumber(candidate.bpm, root.tempo.default, root.tempo.min, root.tempo.max)),
    masterSeed: unsignedInteger(candidate.masterSeed, 1),
    pieceIndex: unsignedInteger(candidate.pieceIndex, 0),
    variationIndex: unsignedInteger(candidate.variationIndex, 0),
    performanceIndex: unsignedInteger(candidate.performanceIndex, 0),
    novelty: clampedNumber(candidate.novelty, 0.5, 0, 1),
    chords: normalizeMusicChords(candidate.chords),
    rhythmLute: normalizeMusicRhythmLute(candidate.rhythmLute),
    humanization: clampedNumber(candidate.humanization, 0.55, 0, 1),
    formOverride,
    tonicOverride,
    mutedParts,
    effects: normalizeMusicEffects(candidate.effects),
  };
}

function normalizeTrack(value: unknown): PersistedTrack | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as { name?: unknown; recipe?: unknown };
  const recipe = normalizeRecipe(candidate.recipe);
  if (!recipe) return null;
  return {
    name:
      typeof candidate.name === "string" && candidate.name.trim()
        ? candidate.name.trim().slice(0, 160)
        : fallbackTrackName(recipe),
    recipe,
  };
}

/** Only a track persisted without a usable name reaches this; the form comes
 * from the cheap description rather than from composing the piece. */
function fallbackTrackName(recipe: MusicReplayRecipe): string {
  return `${getMusicRoot(recipe.rootId).name} · ${MUSIC_FORM_LABELS[describeMusicPiece(recipe).form]}`;
}

/**
 * Hydrating a persisted track keeps it metadata-only: the full piece is
 * composed on first read of `piece` (play, export, detailed display), so
 * loading a library of a hundred entries does not compose a hundred scores on
 * the main thread. Everything a list row, a search, or a cover needs comes
 * from the cheap `description` and `lineup` computed here. Extra fields must
 * be passed in rather than spread over the result, because a spread would
 * read `piece` and force composition.
 */
export function hydrateLibraryTrack<Extra extends object = Record<never, never>>(
  stored: PersistedTrack,
  piece?: MusicPiece,
  extras?: Extra,
): MusicLibraryTrack & Extra {
  const track = createMusicReplayTrack(stored.name, stored.recipe);
  const root = getMusicRoot(stored.recipe.rootId);
  const description = piece ? musicPieceDescription(piece) : describeMusicPiece(stored.recipe);
  const hydrated = {
    ...track,
    rootName: root.name,
    theme: root.theme,
    description,
    lineup: musicPartsLineup(stored.recipe.rootId, description.soundingParts, stored.recipe.mutedParts),
    renderOptions: replayRenderOptions(track),
    ...(extras as Extra),
  } as MusicLibraryTrack & Extra;
  if (piece) {
    hydrated.piece = piece;
    return hydrated;
  }
  Object.defineProperty(hydrated, "piece", {
    enumerable: true,
    configurable: true,
    get(): MusicPiece {
      const generated = generateMusicPiece({ ...stored.recipe, autoAdvance: false });
      Object.defineProperty(hydrated, "piece", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: generated,
      });
      return generated;
    },
  });
  return hydrated;
}

/**
 * The composed piece a track already holds, without composing one to answer.
 * Hydration installs `piece` as a self-replacing getter; only this module
 * knows that encoding, so composed-ness is answered here rather than by
 * descriptor inspection at call sites.
 */
export function composedLibraryPiece(track: MusicReplayTrack): MusicPiece | undefined {
  return Object.getOwnPropertyDescriptor(track, "piece")?.value as MusicPiece | undefined;
}

export function normalizeMusicLibrary(value: unknown): MusicLibrarySnapshot {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return EMPTY_MUSIC_LIBRARY;
  // Both fields present is the library shape; an unexpected extra key (a field
  // a newer build wrote) must not discard the takes that are there.
  if (!Object.hasOwn(value, "recent") || !Object.hasOwn(value, "favorites")) return EMPTY_MUSIC_LIBRARY;
  const candidate = value as { recent?: unknown; favorites?: unknown };
  const recent: MusicHistoryEntry[] = [];
  if (Array.isArray(candidate.recent)) {
    for (const value of candidate.recent.slice(0, MAX_MUSIC_HISTORY)) {
      if (typeof value !== "object" || value === null) continue;
      const entry = value as {
        playId?: unknown;
        playedAt?: unknown;
        track?: unknown;
      };
      const normalized = normalizeTrack(entry.track);
      if (!normalized) continue;
      const playedAt = finiteNumber(entry.playedAt, 0);
      recent.push(
        hydrateLibraryTrack(normalized, undefined, {
          playId:
            typeof entry.playId === "string" && entry.playId
              ? entry.playId
              : `${musicReplayTrackId(normalized.recipe)}:${playedAt}:${recent.length}`,
          playedAt,
        }),
      );
    }
  }
  const favoriteById = new Map<string, MusicFavoriteEntry>();
  if (Array.isArray(candidate.favorites)) {
    const firstRetainedIndex = Math.max(0, candidate.favorites.length - MAX_MUSIC_FAVORITES);
    for (let index = candidate.favorites.length - 1; index >= firstRetainedIndex; index -= 1) {
      const value = candidate.favorites[index];
      if (typeof value !== "object" || value === null) continue;
      const entry = value as {
        favoritedAt?: unknown;
        track?: unknown;
      };
      const normalized = normalizeTrack(entry.track);
      if (!normalized) continue;
      const hydrated = hydrateLibraryTrack(normalized, undefined, {
        favoritedAt: finiteNumber(entry.favoritedAt, 0),
      });
      if (!favoriteById.has(hydrated.id)) {
        favoriteById.set(hydrated.id, hydrated);
      }
    }
  }
  return {
    recent,
    favorites: [...favoriteById.values()].sort((left, right) => left.favoritedAt - right.favoritedAt),
    persistenceError: null,
  };
}

export function persistedTrack(track: MusicReplayTrack): PersistedTrack {
  return { name: track.name, recipe: track.recipe };
}

export function serializeMusicLibrary(library: MusicLibrarySnapshot): string {
  const persisted: PersistedMusicLibrary = {
    recent: library.recent.map((entry) => ({
      playId: entry.playId,
      playedAt: entry.playedAt,
      track: persistedTrack(entry),
    })),
    favorites: library.favorites.map((entry) => ({
      favoritedAt: entry.favoritedAt,
      track: persistedTrack(entry),
    })),
  };
  return JSON.stringify(persisted);
}
