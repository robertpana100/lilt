import { describe, expect, test } from "vitest";
import { generateMusicPiece, type MusicGeneratorConfig } from "../composition/generator";
import { captureMusicReplayRecipe, createMusicReplayTrack, generateReplayPiece, replayRenderOptions } from "./replay";
import { NO_MUTED_PARTS } from "../composition/roots";
import { DEFAULT_MUSIC_EFFECTS } from "../synthesis/effects/config";
import { DEFAULT_MUSIC_CHORDS } from "../composition/chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "../composition/rhythm-lute-config";

const config: MusicGeneratorConfig = {
  rootId: "road",
  bpm: 104,
  masterSeed: 90210,
  pieceIndex: 7,
  variationIndex: 3,
  performanceIndex: 2,
  novelty: 0.72,
  chords: DEFAULT_MUSIC_CHORDS,
  rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
  humanization: 0.41,
  formOverride: "paired-puncta",
  tonicOverride: null,
  autoAdvance: true,
};

describe("music replay recipes", () => {
  test("reconstructs the exact composition and captured rendering options", () => {
    const piece = generateMusicPiece(config);
    const recipe = captureMusicReplayRecipe(
      {
        ...config,
        mutedParts: { strings: true, rhythm: true },
      },
      piece,
    );
    const track = createMusicReplayTrack("The Roadwarden’s Estampie", recipe);
    expect(generateReplayPiece(track)).toEqual(piece);
    expect(replayRenderOptions(track)).toEqual({
      humanization: 0.41,
      chords: DEFAULT_MUSIC_CHORDS,
      rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
      mutedParts: { strings: true, rhythm: true },
      effects: DEFAULT_MUSIC_EFFECTS,
    });
  });

  test("changes identity when the captured performance changes", () => {
    const firstPiece = generateMusicPiece(config);
    const secondConfig = { ...config, performanceIndex: config.performanceIndex + 1 };
    const secondPiece = generateMusicPiece(secondConfig);
    const first = createMusicReplayTrack(
      "First",
      captureMusicReplayRecipe({ ...config, mutedParts: NO_MUTED_PARTS }, firstPiece),
    );
    const second = createMusicReplayTrack(
      "Second",
      captureMusicReplayRecipe({ ...secondConfig, mutedParts: NO_MUTED_PARTS }, secondPiece),
    );
    expect(first.id).not.toBe(second.id);
  });
});
