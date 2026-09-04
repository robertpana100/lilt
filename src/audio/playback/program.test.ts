import { describe, expect, test } from "vitest";
import { generateMusicPiece } from "../composition/generator";
import { NO_MUTED_PARTS, getMusicRoot, type MusicRootId } from "../composition/roots";
import { DEFAULT_MUSIC_EFFECTS } from "../synthesis/effects/config";
import { captureMusicReplayRecipe, createMusicReplayTrack } from "./replay";
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

function replayTrack(name: string, rootId: MusicRootId) {
  const config = engineConfig(rootId);
  return createMusicReplayTrack(name, captureMusicReplayRecipe(config, generateMusicPiece(config)));
}

describe("MusicProgram", () => {
  test("opens on the piece its config describes", () => {
    const program = new MusicProgram(engineConfig("road"));

    expect(program.piece).toEqual(generateMusicPiece(engineConfig("road")));
    expect(program.pieceIndex).toBe(0);
    expect(program.isReplaying).toBe(false);
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

  test("regenerating composes a new piece and abandons the saved take's name", () => {
    const program = new MusicProgram(engineConfig());
    program.loadReplayTrack(replayTrack("A tavern night", "road"));
    expect(program.name).toBe("A tavern night");

    program.regenerate(engineConfig("lament"), 3);

    expect(program.pieceIndex).toBe(3);
    expect(program.piece).toEqual(generateMusicPiece({ ...engineConfig("lament"), pieceIndex: 3 }));
    expect(program.name).not.toBe("A tavern night");
  });

  test("a regenerate before anything reads stays lazy and composes the new config", () => {
    const program = new MusicProgram(engineConfig());

    program.regenerate(engineConfig("lament"), 2);

    expect(program.hasPiece).toBe(false);
    expect(program.piece).toEqual(generateMusicPiece({ ...engineConfig("lament"), pieceIndex: 2 }));
  });

  test("ending a replay hands back the sequence's completion callback", () => {
    const program = new MusicProgram(engineConfig());
    let completed = 0;
    program.setReplaySequence({
      next: () => null,
      onComplete: () => {
        completed += 1;
      },
    });
    program.loadReplayTrack(replayTrack("A tavern night", "road"));

    const onComplete = program.endReplay();

    expect(program.isReplaying).toBe(false);
    onComplete?.();
    expect(completed).toBe(1);
  });

  test("a loaded take carries back the config it was recorded with", () => {
    const program = new MusicProgram(engineConfig());
    const track = replayTrack("The empty chair", "lament");

    program.loadReplayTrack(track);

    expect(program.config.rootId).toBe("lament");
    // A lone take must not roll on into the generated repertoire.
    expect(program.config.autoAdvance).toBe(false);
    expect(program.name).toBe("The empty chair");
  });

  test("a sequenced take keeps advancing and reports the config of each", () => {
    const program = new MusicProgram(engineConfig());
    const tracks = [replayTrack("first", "hearth"), replayTrack("second", "road")];
    program.setReplaySequence({ next: (id) => (id === tracks[0]!.id ? tracks[1]! : null) });
    program.loadReplayTrack(tracks[0]!);

    const advance = program.advance("auto");

    expect(advance.kind).toBe("replay");
    expect(program.config.rootId).toBe("road");
    expect(program.config.autoAdvance).toBe(true);
    expect(program.name).toBe("second");
  });

  test("an exhausted sequence completes once and hands back its callback", () => {
    const program = new MusicProgram(engineConfig());
    const track = replayTrack("only", "hearth");
    const onComplete = () => undefined;
    program.setReplaySequence({ next: () => null, onComplete });
    program.loadReplayTrack(track);

    const advance = program.advance("auto");

    expect(advance).toEqual({ kind: "complete", onComplete });
    expect(program.isReplaying).toBe(false);
    // With the sequence spent, the generator owns what follows.
    expect(program.advance("auto").kind).toBe("piece");
  });

  test("a director chooses what the next generated piece is composed from", () => {
    const program = new MusicProgram(engineConfig("hearth"));
    program.setDirector(() => engineConfig("brawl"));

    const advance = program.advance("auto");

    expect(advance.kind).toBe("piece");
    expect(program.config.rootId).toBe("brawl");
    expect(program.piece.rootId).toBe("brawl");
  });

  test("a saved take is the sequence's to choose, not the director's", () => {
    const program = new MusicProgram(engineConfig());
    const tracks = [replayTrack("first", "hearth"), replayTrack("second", "road")];
    program.setDirector(() => engineConfig("brawl"));
    program.setReplaySequence({ next: (id) => (id === tracks[0]!.id ? tracks[1]! : null) });
    program.loadReplayTrack(tracks[0]!);

    const advance = program.advance("auto");

    expect(advance.kind).toBe("replay");
    expect(program.config.rootId).toBe("road");
  });

  test("nothing is directed once the repertoire has stopped advancing", () => {
    const program = new MusicProgram({ ...engineConfig(), autoAdvance: false });
    let directed = 0;
    program.setDirector((config) => {
      directed += 1;
      return config;
    });

    const advance = program.advance("auto");

    expect(advance).toEqual({ kind: "complete", onComplete: undefined });
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

  test("clearing a replay drops the sequence and the take's identity", () => {
    const program = new MusicProgram(engineConfig());
    program.setReplaySequence({ next: () => null });
    program.loadReplayTrack(replayTrack("saved", "road"));

    program.clearReplay();

    expect(program.isReplaying).toBe(false);
    expect(program.name).not.toBe("saved");
  });
});
