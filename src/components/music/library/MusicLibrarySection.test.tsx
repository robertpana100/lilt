import "@/test/register-dom";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { generateMusicPiece, type MusicGeneratorConfig } from "@/audio/composition/generator";
import {
  getMusicLibrary,
  MUSIC_LIBRARY_STORAGE_KEY,
  recordMusicPiecePlayed,
  reloadMusicLibraryForTests,
  resetMusicLibraryForTests,
} from "@/audio/musicLibrary";
import { captureMusicReplayRecipe } from "@/audio/playback/replay";
import { NO_MUTED_PARTS } from "@/audio/composition/roots";
import { getMusicSettings } from "@/audio/musicSettings";
import { reloadMusicSettingsFromStorage } from "@/test/music-settings";
import { MusicLibrarySection } from "./MusicLibrarySection";
import { DEFAULT_MUSIC_CHORDS } from "@/audio/composition/chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "@/audio/composition/rhythm-lute-config";

const config: MusicGeneratorConfig = {
  rootId: "hearth",
  bpm: 80,
  masterSeed: 44,
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

function addRecent(pieceIndex: number, name: string, playedAt: number) {
  const pieceConfig = { ...config, pieceIndex };
  const piece = generateMusicPiece(pieceConfig);
  const recipe = captureMusicReplayRecipe({ ...pieceConfig, mutedParts: NO_MUTED_PARTS }, piece);
  recordMusicPiecePlayed(piece, recipe, name, playedAt);
}

describe("music library section", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadMusicSettingsFromStorage();
    resetMusicLibraryForTests();
    addRecent(0, "The Áshen Hearth", 100);
    addRecent(1, "Roadwarden’s Lay", 200);
  });

  afterEach(cleanup);

  test("searches recent songs and manages the favourites collection and order", () => {
    render(<MusicLibrarySection />);
    expect(screen.getByText("Roadwarden’s Lay")).toBeTruthy();
    expect(screen.getByText("The Áshen Hearth")).toBeTruthy();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search music library" }), {
      target: { value: "ashen 80" },
    });
    expect(screen.getByText("The Áshen Hearth")).toBeTruthy();
    expect(screen.queryByText("Roadwarden’s Lay")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Add The Áshen Hearth to favourites" }));
    fireEvent.click(screen.getByRole("tab", { name: /Favourites 1/ }));
    expect(screen.getByText("The Áshen Hearth")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play The Áshen Hearth" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Play favourites in order" }));
    expect(getMusicSettings().favoritesOrder).toBe("ordered");

    fireEvent.click(screen.getByRole("button", { name: "Remove The Áshen Hearth from favourites" }));
    expect(screen.getByText("No matching songs")).toBeTruthy();
  });

  test("keeps the shelf to its own height and scrolls it there", () => {
    render(<MusicLibrarySection />);

    const panel = document.querySelector("[data-music-library-scroll-panel]");
    expect(panel).toBeTruthy();
    // However many songs Lilt has played, the studio stays one page.
    expect(panel?.className).toContain("max-h-72");
    expect(panel?.className).toContain("overflow-y-auto");
    expect(panel?.className).toContain("overscroll-contain");
  });

  test("renders a persisted shelf without composing any of its takes", () => {
    const pieceConfig = { ...config, pieceIndex: 7 };
    const piece = generateMusicPiece(pieceConfig);
    const recipe = captureMusicReplayRecipe({ ...pieceConfig, mutedParts: NO_MUTED_PARTS }, piece);
    localStorage.setItem(
      MUSIC_LIBRARY_STORAGE_KEY,
      JSON.stringify({
        recent: [{ playId: "p1", playedAt: 1, track: { name: "Persisted song", recipe } }],
        favorites: [{ favoritedAt: 2, track: { name: "Persisted favorite", recipe } }],
      }),
    );
    reloadMusicLibraryForTests();

    render(<MusicLibrarySection />);
    expect(screen.getByText("Persisted song")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Cover of Persisted song" })).toBeTruthy();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search music library" }), {
      target: { value: `persisted ${piece.bpm}` },
    });
    expect(screen.getByText("Persisted song")).toBeTruthy();

    // The row and the search drew everything from the cheap description; the
    // full score is still an unread lazy accessor on both shelves.
    for (const entry of [getMusicLibrary().recent[0], getMusicLibrary().favorites[0]]) {
      expect(Object.getOwnPropertyDescriptor(entry, "piece")?.get).toBeDefined();
    }
  });

  test("gives every saved take its own cover and MIDI export", () => {
    render(<MusicLibrarySection />);

    expect(screen.getByRole("img", { name: "Cover of Roadwarden’s Lay" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Cover of The Áshen Hearth" })).toBeTruthy();

    expect(screen.getByRole("button", { name: "Export Roadwarden’s Lay as MIDI" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Export Roadwarden’s Lay as WAV" })).toBeNull();
  });
});
