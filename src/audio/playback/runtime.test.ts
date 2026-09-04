import { describe, expect, test } from "vitest";
import { generateMusicPiece } from "../composition/generator";
import { getMusicRoot, NO_MUTED_PARTS } from "../composition/roots";
import { DEFAULT_MUSIC_EFFECTS } from "../synthesis/effects/config";
import { musicPieceLineup } from "../composition/lineup";
import { captureMusicReplayRecipe } from "./replay";
import { MusicRuntimePublisher, musicPieceSnapshot } from "./runtime";
import type { MusicEngineConfig } from "./types";
import { DEFAULT_MUSIC_CHORDS } from "../composition/chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "../composition/rhythm-lute-config";

function config(rootId: "hearth" | "road" = "hearth"): MusicEngineConfig {
  return {
    rootId,
    bpm: getMusicRoot(rootId).tempo.default,
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

function piece(rootId: "hearth" | "road" = "hearth") {
  return generateMusicPiece(config(rootId));
}

describe("musicPieceSnapshot", () => {
  test("carries the piece's identity and the name it is published under", () => {
    const source = piece();

    expect(musicPieceSnapshot(source, "A tavern night", config(), DEFAULT_MUSIC_EFFECTS)).toEqual({
      piece: source,
      recipe: captureMusicReplayRecipe(config(), source),
      lineup: musicPieceLineup(source, NO_MUTED_PARTS),
      soundingEffects: DEFAULT_MUSIC_EFFECTS,
      rootId: source.rootId,
      pieceIndex: source.pieceIndex,
      compositionSeed: source.compositionSeed,
      variationSeed: source.variationSeed,
      performanceSeed: source.performanceSeed,
      form: source.form,
      tonicMidi: source.tonicMidi,
      durationSeconds: source.durationSeconds,
      gapSeconds: source.gapSeconds,
      name: "A tavern night",
    });
  });

  test("a muted lute is left out of the lineup entirely", () => {
    const muted = musicPieceSnapshot(
      piece(),
      "Quiet",
      {
        ...config(),
        mutedParts: { strings: true, rhythm: true },
      },
      DEFAULT_MUSIC_EFFECTS,
    );

    expect(muted.lineup).toEqual([]);
  });

  test("reports the rhythm lute separately from the lead lute", () => {
    const sourceConfig = config();
    const source = generateMusicPiece(sourceConfig);
    expect(
      musicPieceSnapshot(source, "Lute duo", sourceConfig, DEFAULT_MUSIC_EFFECTS).lineup.map((entry) => entry.part),
    ).toEqual(["strings", "rhythm"]);
    expect(
      musicPieceSnapshot(
        source,
        "Lead only",
        {
          ...sourceConfig,
          mutedParts: { strings: false, rhythm: true },
        },
        DEFAULT_MUSIC_EFFECTS,
      ).lineup.map((entry) => entry.part),
    ).toEqual(["strings"]);
  });
});

describe("MusicRuntimePublisher", () => {
  test("the opening snapshot is not composed until something reads it", () => {
    let composed = 0;
    const publisher = new MusicRuntimePublisher(() => {
      composed += 1;
      return { piece: piece(), name: "Opening", config: config() };
    });

    expect(composed).toBe(0);
    expect(publisher.get().status).toBe("stopped");
    expect(composed).toBe(1);
    publisher.publish({ status: "gap" });
    expect(composed).toBe(1);
  });

  test("a pieceless publish before the first read composes nothing", () => {
    let composed = 0;
    const publisher = new MusicRuntimePublisher(() => {
      composed += 1;
      return { piece: piece(), name: "Opening", config: config() };
    });
    const seen: Array<string | null> = [];
    publisher.subscribe(() => seen.push(publisher.peek()?.status ?? null));

    // A music-disabled boot stops an engine that never started.
    publisher.publish({ status: "stopped" });

    expect(composed).toBe(0);
    expect(publisher.peek()).toBeNull();
    // Listeners were still told, and a peeking listener saw no snapshot.
    expect(seen).toEqual([null]);

    // The stash is folded into the opening snapshot on the first real read.
    publisher.publish({ status: "error" });
    expect(composed).toBe(0);
    expect(publisher.get()).toMatchObject({ status: "error", name: "Opening" });
    expect(composed).toBe(1);
  });

  test("a piece publish before the first read opens on that piece instead of composing one", () => {
    let composed = 0;
    const publisher = new MusicRuntimePublisher(() => {
      composed += 1;
      return { piece: piece(), name: "Opening", config: config() };
    });
    const published = piece("road");

    publisher.publish({ status: "gap", sectionId: null });
    publisher.publish({
      status: "playing",
      sectionId: published.sections[0]!.id,
      pieceStartNonce: 1,
      ...musicPieceSnapshot(published, "Road night", config("road"), DEFAULT_MUSIC_EFFECTS),
    });

    expect(composed).toBe(0);
    expect(publisher.peek()).not.toBeNull();
    expect(publisher.get()).toMatchObject({
      status: "playing",
      name: "Road night",
      rootId: "road",
      pieceStartNonce: 1,
    });
    expect(publisher.get().piece).toBe(published);
    expect(composed).toBe(0);
  });

  test("opens stopped on the first section of its piece", () => {
    const source = piece();
    const publisher = new MusicRuntimePublisher(() => ({ piece: source, name: "Opening", config: config() }));

    expect(publisher.get()).toMatchObject({
      status: "stopped",
      sectionId: source.sections[0]!.id,
      name: "Opening",
      tonicMidi: source.tonicMidi,
    });
  });

  test("opens with the lineup its piece and config resolve to", () => {
    const source = piece();
    const publisher = new MusicRuntimePublisher(() => ({ piece: source, name: "Opening", config: config() }));

    expect(publisher.get().lineup).toEqual(musicPieceLineup(source, NO_MUTED_PARTS));
  });

  test("a patch replaces only the fields it names", () => {
    const publisher = new MusicRuntimePublisher(() => ({ piece: piece(), name: "Opening", config: config() }));
    const before = publisher.get();

    publisher.publish({ status: "playing" });

    expect(publisher.get().status).toBe("playing");
    expect(publisher.get().name).toBe(before.name);
    expect(publisher.get().sectionId).toBe(before.sectionId);
  });

  test("every publish notifies subscribers with the new snapshot in place", () => {
    const publisher = new MusicRuntimePublisher(() => ({ piece: piece(), name: "Opening", config: config() }));
    const seen: string[] = [];
    publisher.subscribe(() => seen.push(publisher.get().status));

    publisher.publish({ status: "gap" });
    publisher.publish({ status: "playing" });

    expect(seen).toEqual(["gap", "playing"]);
  });

  test("an unsubscribed listener stops hearing about changes", () => {
    const publisher = new MusicRuntimePublisher(() => ({ piece: piece(), name: "Opening", config: config() }));
    let notifications = 0;
    const unsubscribe = publisher.subscribe(() => {
      notifications += 1;
    });

    publisher.publish({ status: "gap" });
    unsubscribe();
    publisher.publish({ status: "playing" });

    expect(notifications).toBe(1);
  });

  test("the previous snapshot is not mutated in place", () => {
    const publisher = new MusicRuntimePublisher(() => ({ piece: piece(), name: "Opening", config: config() }));
    const before = publisher.get();

    publisher.publish({ status: "playing", sectionId: "changed" });

    expect(before.status).toBe("stopped");
    expect(before.sectionId).not.toBe("changed");
  });
});
