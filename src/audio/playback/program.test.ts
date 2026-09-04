import { describe, expect, test } from "vitest";
import { nameMusicPiece } from "../composition/names";
import { generateMusicPiece } from "../composition/generator";
import { NO_MUTED_PARTS, getMusicRoot, type MusicRootId } from "../composition/roots";
import { DEFAULT_MUSIC_EFFECTS } from "../synthesis/effects/config";
import { MusicProgram } from "./program";
import type { MusicEngineConfig } from "./types";
import { DEFAULT_MUSIC_CHORDS } from "../composition/chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "../composition/rhythm-lute-config";

function engineConfig(rootId: MusicRootId = "hearth"): MusicEngineConfig {
  const root = getMusicRoot(rootId);
  return {
    rootId,
    bpm: root.tempo.default,
    masterSeed: 42,
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
    mutedParts: NO_MUTED_PARTS,
    effects: DEFAULT_MUSIC_EFFECTS,
  };
}

describe("MusicProgram", () => {
  test("opens on the piece its config describes", () => {
    const program = new MusicProgram(engineConfig("road"));

    expect(program.piece).toEqual(generateMusicPiece(engineConfig("road")));
    expect(program.pieceIndex).toBe(0);
    expect(program.name.length).toBeGreaterThan(0);
  });

  test("indexes the current piece's events by pulse", () => {
    const program = new MusicProgram(engineConfig());
    const first = program.piece.events[0]!;

    expect(program.eventsAt(first.startPulse).map((entry) => entry.event)).toContain(first);
    expect(program.eventsAt(-1)).toEqual([]);
  });

  test("advancing walks the generated repertoire", () => {
    const program = new MusicProgram(engineConfig());
    const opening = program.pieceIndex;

    expect(program.advance("auto")).toEqual({ kind: "piece" });
    expect(program.pieceIndex).toBe(opening + 1);
    expect(program.config).toEqual(engineConfig());
    expect(program.eventsAt(program.piece.events[0]!.startPulse).length).toBeGreaterThan(0);
  });

  test("regenerating composes and names a new piece", () => {
    const program = new MusicProgram(engineConfig());
    const before = program.piece;

    program.regenerate(engineConfig("lament"), 3);

    expect(program.pieceIndex).toBe(3);
    expect(program.piece).toEqual(generateMusicPiece({ ...engineConfig("lament"), pieceIndex: 3 }));
    expect(program.piece).not.toBe(before);
    expect(program.name).toBe(nameMusicPiece(program.piece));
  });

  test("a regenerate before anything reads stays lazy and composes the new config", () => {
    const program = new MusicProgram(engineConfig());

    program.regenerate(engineConfig("lament"), 2);

    expect(program.hasPiece).toBe(false);
    expect(program.piece).toEqual(generateMusicPiece({ ...engineConfig("lament"), pieceIndex: 2 }));
  });

  test("a director chooses what the next generated piece is composed from", () => {
    const program = new MusicProgram(engineConfig("hearth"));
    program.setDirector(() => engineConfig("brawl"));

    const advance = program.advance("auto");

    expect(advance.kind).toBe("piece");
    expect(program.config.rootId).toBe("brawl");
    expect(program.piece.rootId).toBe("brawl");
  });

  test("nothing is directed once the repertoire has stopped advancing", () => {
    const program = new MusicProgram({ ...engineConfig(), autoAdvance: false });
    let directed = 0;
    program.setDirector((config) => {
      directed += 1;
      return config;
    });

    const advance = program.advance("auto");

    expect(advance).toEqual({ kind: "complete" });
    expect(directed).toBe(0);
  });

  test("a skip advances a stopped repertoire without turning auto-advance on", () => {
    const program = new MusicProgram({ ...engineConfig(), autoAdvance: false });

    const advance = program.advance("skip");

    expect(advance).toEqual({ kind: "piece" });
    // The generated piece must not inherit the true the skip passed in.
    expect(program.config).toEqual({ ...engineConfig(), autoAdvance: false });
  });

  test("a skip survives a director that rebuilds its answer with auto-advance off", () => {
    // The session's director composes the next config from its own snapshot,
    // where auto-advance mirrors the Endless repertoire toggle. A skip made
    // with that toggle off must still land on a piece.
    const program = new MusicProgram({ ...engineConfig(), autoAdvance: false });
    program.setDirector(() => ({ ...engineConfig("brawl"), autoAdvance: false }));

    const advance = program.advance("skip");

    expect(advance).toEqual({ kind: "piece" });
    expect(program.piece.rootId).toBe("brawl");
    expect(program.config.autoAdvance).toBe(false);
  });

  test("clearing a director returns the repertoire to its own config", () => {
    const program = new MusicProgram(engineConfig("hearth"));
    program.setDirector(() => engineConfig("brawl"));
    program.setDirector(null);

    const advance = program.advance("auto");

    expect(advance).toEqual({ kind: "piece" });
    expect(program.config).toEqual(engineConfig("hearth"));
    expect(program.piece.rootId).toBe("hearth");
  });
});
