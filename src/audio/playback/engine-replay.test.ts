import { afterEach, describe, expect, test } from "vitest";
import { generateMusicPiece } from "../composition/generator";
import { type MusicRootId } from "../composition/roots";
import { resetMusicLibraryForTests } from "../musicLibrary";
import { DEFAULT_MUSIC_EFFECTS } from "../synthesis/effects/config";
import { varyMusicEffects } from "../synthesis/effects/variation";
import { engineConfig } from "../tavern-music.test-support";
import { TavernMusicEngine } from "./engine";
import { captureMusicReplayRecipe, createMusicReplayTrack } from "./replay";

import {
  fakeAudioContext,
  fakeTimers,
  flushMusicPromises,
  readyEngine,
  runThroughGap,
  runToPieceEnd,
} from "./engine.test-support";

describe("procedural-lute replay and configuration", () => {
  afterEach(resetMusicLibraryForTests);

  test("a skip moves to the next take of a replay sequence", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);
    const tracks = ["hearth", "road"].map((rootId) =>
      createMusicReplayTrack(
        `${rootId} take`,
        captureMusicReplayRecipe(
          engineConfig(rootId as MusicRootId),
          generateMusicPiece(engineConfig(rootId as MusicRootId)),
        ),
      ),
    );

    try {
      await engine.start();
      engine.playReplayTrack(tracks[0]!, {
        next: (currentTrackId) => (currentTrackId === tracks[0]!.id ? tracks[1]! : null),
      });
      await flushMusicPromises();

      engine.skipToNextPiece();
      await flushMusicPromises();

      expect(engine.getRuntimeSnapshot().name).toBe("road take");
      expect(engine.getRuntimeSnapshot().rootId).toBe("road");
    } finally {
      engine.dispose();
    }
  });

  test("each replay take reproduces its saved effects through the take's own variation", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);
    const track = (rootId: MusicRootId, highGainDb: number) => {
      const configured = {
        ...engineConfig(rootId),
        effects: {
          ...DEFAULT_MUSIC_EFFECTS,
          tone: { ...DEFAULT_MUSIC_EFFECTS.tone, highGainDb },
        },
      };
      return createMusicReplayTrack(
        `${rootId} take`,
        captureMusicReplayRecipe(configured, generateMusicPiece(configured)),
      );
    };
    const first = track("hearth", 7.25);
    const second = track("road", 9.75);

    try {
      await engine.start();
      audio.targetValues.length = 0;
      engine.playReplayTrack(first, {
        next: (currentTrackId) => (currentTrackId === first.id ? second : null),
      });
      const firstVaried = varyMusicEffects(first.recipe.effects, engine.getRuntimeSnapshot().performanceSeed);
      expect(audio.targetValues).toContain(firstVaried.tone.highGainDb);
      expect(firstVaried.tone.highGainDb).not.toBe(7.25);

      audio.targetValues.length = 0;
      engine.skipToNextPiece();
      const secondVaried = varyMusicEffects(second.recipe.effects, engine.getRuntimeSnapshot().performanceSeed);
      expect(audio.targetValues).toContain(secondVaried.tone.highGainDb);
    } finally {
      engine.dispose();
    }
  });

  test("a skip while the score is stopped changes nothing", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      const before = engine.getRuntimeSnapshot();
      engine.skipToNextPiece();
      await flushMusicPromises();

      expect(engine.getRuntimeSnapshot()).toEqual(before);
    } finally {
      engine.dispose();
    }
  });

  test("reports completion instead of advancing when automatic playback is off", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      engine.configure({ ...engineConfig("hearth"), autoAdvance: false });
      await engine.start();
      const before = engine.getRuntimeSnapshot().pieceIndex;
      await runToPieceEnd(engine, audio, timers);

      expect(engine.getRuntimeSnapshot()).toMatchObject({ status: "complete", sectionId: null });
      expect(engine.getRuntimeSnapshot().pieceIndex).toBe(before);
    } finally {
      engine.dispose();
    }
  });

  test("walks a replay sequence and completes once it is exhausted", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);
    const tracks = ["hearth", "road"].map((rootId) =>
      createMusicReplayTrack(
        `${rootId} take`,
        captureMusicReplayRecipe(
          engineConfig(rootId as MusicRootId),
          generateMusicPiece(engineConfig(rootId as MusicRootId)),
        ),
      ),
    );
    let completed = false;

    try {
      await engine.start();
      engine.playReplayTrack(tracks[0]!, {
        next: (currentTrackId) => (currentTrackId === tracks[0]!.id ? tracks[1]! : null),
        onComplete: () => {
          completed = true;
        },
      });
      await flushMusicPromises();
      expect(engine.getRuntimeSnapshot().name).toBe("hearth take");

      await runToPieceEnd(engine, audio, timers);
      await runThroughGap(engine, audio, timers);
      expect(engine.getRuntimeSnapshot().name).toBe("road take");

      await runToPieceEnd(engine, audio, timers);
      await runThroughGap(engine, audio, timers);
      expect(engine.getRuntimeSnapshot().status).toBe("complete");
      expect(completed).toBe(true);
    } finally {
      engine.dispose();
    }
  });

  test("a configure before anything reads composes nothing on a disabled boot", () => {
    const engine = new TavernMusicEngine({ createAudioContext: () => null });
    try {
      engine.configure(engineConfig("road"));
      // The opening piece must not be composed by the boot-time configure;
      // the first genuine read composes it from the configured root.
      expect(engine.peekRuntimeSnapshot()).toBeNull();
      expect(engine.getRuntimeSnapshot().rootId).toBe("road");
      expect(engine.getRuntimeSnapshot().status).toBe("stopped");
    } finally {
      engine.dispose();
    }
  });

  test("a same-score configure keeps a playing replay sequence and its take", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);
    const tracks = ["hearth", "road"].map((rootId) =>
      createMusicReplayTrack(
        `${rootId} take`,
        captureMusicReplayRecipe(
          engineConfig(rootId as MusicRootId),
          generateMusicPiece(engineConfig(rootId as MusicRootId)),
        ),
      ),
    );

    try {
      await engine.start();
      engine.playReplayTrack(tracks[0]!, {
        next: (currentTrackId) => (currentTrackId === tracks[0]!.id ? tracks[1]! : null),
      });
      await flushMusicPromises();

      // Muting playback must not replace the take or its queued sequence.
      engine.configure({
        ...engineConfig("hearth"),
        mutedParts: { strings: true, rhythm: true },
      });
      await flushMusicPromises();
      expect(engine.getRuntimeSnapshot().name).toBe("hearth take");

      await runToPieceEnd(engine, audio, timers);
      await runThroughGap(engine, audio, timers);
      expect(engine.getRuntimeSnapshot().name).toBe("road take");
    } finally {
      engine.dispose();
    }
  });

  test("a score-changing configure ends a replay sequence the way finishing it would", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);
    const track = createMusicReplayTrack(
      "hearth take",
      captureMusicReplayRecipe(engineConfig("hearth"), generateMusicPiece(engineConfig("hearth"))),
    );
    let completed = false;

    try {
      await engine.start();
      engine.playReplayTrack(track, {
        next: () => null,
        onComplete: () => {
          completed = true;
        },
      });
      await flushMusicPromises();

      engine.configure(engineConfig("road"));
      await flushMusicPromises();

      expect(completed).toBe(true);
      expect(engine.getRuntimeSnapshot().name).not.toBe("hearth take");
    } finally {
      engine.dispose();
    }
  });
});
