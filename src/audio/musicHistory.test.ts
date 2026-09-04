import { beforeEach, describe, expect, test } from "vitest";
import { generateMusicPiece, musicPieceDescription, type MusicGeneratorConfig } from "./composition/generator";
import { musicPieceLineup } from "./composition/lineup";
import {
  composedLibraryPiece,
  getMusicHistory,
  recordMusicPiecePlayed,
  resetMusicLibraryForTests as resetMusicHistoryForTests,
  getMusicLibrary,
  MAX_MUSIC_FAVORITES,
  MUSIC_LIBRARY_STORAGE_KEY,
  reloadMusicLibraryForTests,
  searchMusicTracks,
  toggleMusicFavorite,
} from "./musicLibrary";
import { captureMusicReplayRecipe } from "./playback/replay";
import { NO_MUTED_PARTS } from "./composition/roots";
import { DEFAULT_MUSIC_EFFECTS } from "./synthesis/effects/config";
import { DEFAULT_MUSIC_CHORDS } from "./composition/chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "./composition/rhythm-lute-config";

const config: MusicGeneratorConfig = {
  rootId: "hearth",
  bpm: 80,
  masterSeed: 9,
  pieceIndex: 0,
  variationIndex: 0,
  performanceIndex: 0,
  novelty: 0.5,
  chords: DEFAULT_MUSIC_CHORDS,
  rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
  humanization: 0.55,
  formOverride: null,
  tonicOverride: null,
  autoAdvance: true,
};

describe("music history", () => {
  beforeEach(resetMusicHistoryForTests);

  test("deduplicates a continuing song and keeps only the latest 25", () => {
    const first = generateMusicPiece(config);
    const renderConfig = {
      ...config,
      humanization: 0.2,
      mutedParts: { strings: true, rhythm: true },
    } as const;
    const firstRecipe = captureMusicReplayRecipe(renderConfig, first);
    recordMusicPiecePlayed(first, firstRecipe, "First hearth song", 100);
    expect(getMusicHistory()[0]!.renderOptions).toEqual({
      humanization: 0.2,
      chords: DEFAULT_MUSIC_CHORDS,
      rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
      mutedParts: { strings: true, rhythm: true },
      effects: DEFAULT_MUSIC_EFFECTS,
    });
    recordMusicPiecePlayed(first, firstRecipe, "First hearth song", 200);
    expect(getMusicHistory()).toHaveLength(1);
    expect(getMusicHistory()[0]!.playedAt).toBe(200);

    for (let pieceIndex = 1; pieceIndex <= 26; pieceIndex += 1) {
      const piece = generateMusicPiece({ ...config, pieceIndex });
      const recipe = captureMusicReplayRecipe({ ...config, pieceIndex, mutedParts: NO_MUTED_PARTS }, piece);
      recordMusicPiecePlayed(piece, recipe, `Hearth song ${pieceIndex}`, 200 + pieceIndex);
    }
    expect(getMusicHistory()).toHaveLength(25);
    expect(getMusicHistory()[0]!.piece.pieceIndex).toBe(26);
    expect(getMusicHistory().at(-1)?.piece.pieceIndex).toBe(2);
  });

  test("persists compact replay recipes and keeps favourites after history eviction", () => {
    const first = generateMusicPiece(config);
    const recipe = captureMusicReplayRecipe({ ...config, mutedParts: NO_MUTED_PARTS }, first);
    recordMusicPiecePlayed(first, recipe, "The Áshen Hearth", 100);
    const favorite = getMusicHistory()[0]!;
    expect(toggleMusicFavorite(favorite, 150)).toBe("added");

    for (let pieceIndex = 1; pieceIndex <= 30; pieceIndex += 1) {
      const piece = generateMusicPiece({ ...config, pieceIndex });
      const nextRecipe = captureMusicReplayRecipe({ ...config, pieceIndex, mutedParts: NO_MUTED_PARTS }, piece);
      recordMusicPiecePlayed(piece, nextRecipe, `Road song ${pieceIndex}`, 200 + pieceIndex);
    }

    expect(getMusicLibrary().recent).toHaveLength(25);
    expect(getMusicLibrary().favorites.map((entry) => entry.name)).toEqual(["The Áshen Hearth"]);
    const raw = localStorage.getItem(MUSIC_LIBRARY_STORAGE_KEY) ?? "";
    expect(Object.keys(JSON.parse(raw))).toEqual(["recent", "favorites"]);
    expect(raw).not.toContain('"events"');

    reloadMusicLibraryForTests();
    expect(getMusicLibrary().favorites[0]!.piece).toEqual(first);
    expect(getMusicLibrary().favorites[0]!.name).toBe("The Áshen Hearth");
  });

  test("an unexpected extra field in stored JSON keeps the saved takes", () => {
    const piece = generateMusicPiece(config);
    const recipe = captureMusicReplayRecipe({ ...config, mutedParts: NO_MUTED_PARTS }, piece);
    recordMusicPiecePlayed(piece, recipe, "Kept despite a stray field", 100);
    const stored = JSON.parse(localStorage.getItem(MUSIC_LIBRARY_STORAGE_KEY) ?? "{}") as Record<string, unknown>;
    stored.futureField = { unknown: true };
    localStorage.setItem(MUSIC_LIBRARY_STORAGE_KEY, JSON.stringify(stored));

    reloadMusicLibraryForTests();
    expect(getMusicLibrary().recent[0]!.name).toBe("Kept despite a stray field");
  });

  test("stored JSON without the library fields starts empty", () => {
    localStorage.setItem(MUSIC_LIBRARY_STORAGE_KEY, JSON.stringify({ unrelated: true }));
    reloadMusicLibraryForTests();
    expect(getMusicLibrary().recent).toEqual([]);
    expect(getMusicLibrary().favorites).toEqual([]);
  });

  test("searches titles and musical metadata with normalized tokens", () => {
    const piece = generateMusicPiece(config);
    const recipe = captureMusicReplayRecipe({ ...config, mutedParts: NO_MUTED_PARTS }, piece);
    recordMusicPiecePlayed(piece, recipe, "The Áshen Hearth", 100);
    const entries = getMusicHistory();
    expect(searchMusicTracks(entries, "ashen 80")).toHaveLength(1);
    expect(searchMusicTracks(entries, `calm ${piece.form}`)).toHaveLength(1);
    expect(searchMusicTracks(entries, "brawl")).toHaveLength(0);
  });

  test("hydrates persisted tracks without composing until the piece is read", () => {
    const piece = generateMusicPiece(config);
    const recipe = captureMusicReplayRecipe({ ...config, mutedParts: NO_MUTED_PARTS }, piece);
    localStorage.setItem(
      MUSIC_LIBRARY_STORAGE_KEY,
      JSON.stringify({
        recent: [{ playId: "p1", playedAt: 1, track: { name: "Stored song", recipe } }],
        favorites: [{ favoritedAt: 2, track: { name: "Stored favorite", recipe } }],
      }),
    );
    reloadMusicLibraryForTests();

    const entry = getMusicLibrary().recent[0]!;
    const favorite = getMusicLibrary().favorites[0]!;
    // Hydration keeps metadata only; the piece is composed only when read.
    expect(composedLibraryPiece(entry)).toBeUndefined();
    expect(composedLibraryPiece(favorite)).toBeUndefined();
    expect(entry.name).toBe("Stored song");
    expect(entry.renderOptions.humanization).toBe(recipe.humanization);

    // Reading composes once and memoizes the result in place.
    expect(entry.piece).toEqual(piece);
    expect(composedLibraryPiece(entry)).toEqual(piece);
    expect(composedLibraryPiece(favorite)).toBeUndefined();
  });

  test("listing metadata, lineup, cover identity, and search never compose the piece", () => {
    const piece = generateMusicPiece(config);
    const recipe = captureMusicReplayRecipe({ ...config, mutedParts: NO_MUTED_PARTS }, piece);
    localStorage.setItem(
      MUSIC_LIBRARY_STORAGE_KEY,
      JSON.stringify({
        recent: [{ playId: "p1", playedAt: 1, track: { name: "Stored song", recipe } }],
        favorites: [],
      }),
    );
    reloadMusicLibraryForTests();

    const entries = getMusicHistory();
    const entry = entries[0]!;
    // Everything a list row shows agrees with the composed piece.
    expect(entry.description).toEqual(musicPieceDescription(piece));
    expect(entry.lineup).toEqual(musicPieceLineup(piece, NO_MUTED_PARTS));
    // Searching form and tempo works from the description alone.
    expect(searchMusicTracks(entries, `${piece.bpm} bpm`)).toHaveLength(1);
    expect(searchMusicTracks(entries, piece.form)).toHaveLength(1);
    // And none of it forced composition.
    expect(composedLibraryPiece(entry)).toBeUndefined();
  });

  test("recovers from malformed persisted data without throwing", () => {
    localStorage.setItem(MUSIC_LIBRARY_STORAGE_KEY, "{");
    reloadMusicLibraryForTests();
    expect(getMusicLibrary().recent).toEqual([]);
    expect(getMusicLibrary().persistenceError).toContain("could not be loaded");
  });

  test("bounds persisted favorites and retains the newest entries", () => {
    const piece = generateMusicPiece(config);
    const recipe = captureMusicReplayRecipe({ ...config, mutedParts: NO_MUTED_PARTS }, piece);
    const favorites = Array.from({ length: MAX_MUSIC_FAVORITES + 2 }, (_, index) => ({
      favoritedAt: index,
      track: { name: `Favorite ${index}`, recipe: { ...recipe, pieceIndex: index } },
    }));
    localStorage.setItem(MUSIC_LIBRARY_STORAGE_KEY, JSON.stringify({ recent: [], favorites }));
    reloadMusicLibraryForTests();

    expect(getMusicLibrary().favorites).toHaveLength(MAX_MUSIC_FAVORITES);
    expect(getMusicLibrary().favorites[0]!.name).toBe("Favorite 2");
    expect(getMusicLibrary().favorites.at(-1)?.name).toBe(`Favorite ${MAX_MUSIC_FAVORITES + 1}`);
  });
});
