import { describe, expect, test } from "vitest";
import { generateMusicPiece, type MusicGeneratorConfig } from "./generator";
import { nameMusicPiece } from "./names";
import { DEFAULT_MUSIC_CHORDS } from "./chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "./rhythm-lute-config";

const config: MusicGeneratorConfig = {
  rootId: "hearth",
  bpm: 80,
  masterSeed: 1234,
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

describe("music names", () => {
  test("names are deterministic and respond to theme and tempo", () => {
    const piece = generateMusicPiece(config);
    expect(nameMusicPiece(piece)).toBe(nameMusicPiece(generateMusicPiece(config)));
    expect(nameMusicPiece(generateMusicPiece({ ...config, rootId: "brawl", bpm: 168 }))).not.toBe(
      nameMusicPiece(piece),
    );
  });

  test("uses the full set of curated title structures", () => {
    const structures = new Set(
      Array.from({ length: 160 }, (_, index) =>
        nameMusicPiece(
          generateMusicPiece({
            ...config,
            masterSeed: Math.imul(index + 1, 0x9e3779b1) >>> 0,
          }),
        ),
      ).map((title) => {
        if (title.includes(", ")) return "subtitle";
        if (/^The .+ of the /u.test(title)) return "of";
        if (title.includes("’s ")) return "possessive";
        if (/^The /u.test(title)) return "article";
        if (title.includes(" at ")) return "place";
        return "compact";
      }),
    );
    expect(structures).toEqual(new Set(["subtitle", "of", "possessive", "article", "place", "compact"]));
  });

  test("produces clean bounded titles for every musical root", () => {
    for (const rootId of [
      "hearth",
      "road",
      "revelry",
      "lament",
      "shadows",
      "brawl",
      "courtly",
      "pilgrimage",
      "guildhall",
    ] as const) {
      const title = nameMusicPiece(generateMusicPiece({ ...config, rootId }));
      expect(title.length).toBeGreaterThan(5);
      expect(title.length).toBeLessThanOrEqual(80);
      expect(title).not.toMatch(/\s{2,}/u);
      expect(title).not.toContain("—");
    }
  });
});
