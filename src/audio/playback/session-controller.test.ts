import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { generateMusicPiece } from "../composition/generator";
import { musicPieceLineup } from "../composition/lineup";
import { TavernMusicEngine } from "./engine";
import { MusicSession } from "./session-controller";
import { createInitialMusicSessionState } from "./session-state";

describe("music debug controller", () => {
  let session: MusicSession;
  let playback: TavernMusicEngine;

  beforeEach(() => {
    const initial = createInitialMusicSessionState();
    playback = new TavernMusicEngine({ initialConfig: initial, createAudioContext: () => null });
    session = new MusicSession(playback, initial, { getControlMode: () => "override" });
  });

  afterEach(() => playback.dispose());

  test("starts each client session with one bounded random seed", () => {
    const initial = session.getInitialState();
    expect(Number.isInteger(initial.masterSeed)).toBe(true);
    expect(initial.masterSeed).toBeGreaterThanOrEqual(0);
    expect(initial.masterSeed).toBeLessThanOrEqual(0xffff_ffff);
    expect(session.getState().masterSeed).toBe(initial.masterSeed);
  });

  test("the engine opens on the session's root rather than a default of its own", () => {
    // The per-launch root must seed both the displayed session and the engine's
    // opening composition.
    const initial = session.getInitialState();
    const opening = generateMusicPiece(initial);

    expect(playback.getRuntimeSnapshot().lineup).toEqual(musicPieceLineup(opening, initial.mutedParts));
  });

  test("the next piece carries a variety change still inside its debounce", () => {
    // During the debounce window the session snapshot is the authoritative
    // value, including when directing the successor to the current piece.
    session.setNovelty(0.91);

    expect(session.directNextPiece().novelty).toBeCloseTo(0.91, 5);
    expect(session.getState().novelty).toBeCloseTo(0.91, 5);
  });

  test("variation and performance rerolls preserve the master seed", () => {
    session.setMasterSeed(1234);
    session.newVariation();
    expect(session.getState()).toMatchObject({ masterSeed: 1234, variationIndex: 1, performanceIndex: 0 });
    session.newPerformance();
    expect(session.getState()).toMatchObject({ masterSeed: 1234, variationIndex: 1, performanceIndex: 1 });
  });

  test("changing roots resets composition locks", () => {
    session.setRoot("road");
    expect(session.getState()).toMatchObject({
      rootId: "road",
      pieceIndex: 0,
      variationIndex: 0,
      performanceIndex: 0,
      formOverride: null,
      tonicOverride: null,
    });
  });

  test("rejects form locks unsupported by the active root", () => {
    session.setRoot("guildhall");
    session.setFormOverride("paired-puncta");
    expect(session.getState().formOverride).toBeNull();
    session.setFormOverride("ballata");
    expect(session.getState().formOverride).toBe("ballata");
  });

  test("automatic repertoire preference changes without rerolling the song", () => {
    const seed = session.getState().masterSeed;
    session.setAutoAdvance(false);
    expect(session.getState()).toMatchObject({ masterSeed: seed, autoAdvance: false });
  });
});
