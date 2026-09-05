import { describe, expect, test } from "vitest";
import { generateMusicPiece } from "@/audio/composition/generator";
import { engineConfig } from "../tavern-music.test-support";
import { TavernMusicEngine } from "@/audio/playback/engine";

import { fakeAudioContext, fakeTimers, flushMusicPromises, readyEngine, runToPieceEnd } from "./engine.test-support";

describe("procedural-lute configuration", () => {
  test("changing mutes keeps the sounding score and its generated successor", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);
    const config = engineConfig("hearth");

    try {
      engine.configure(config);
      await engine.start();
      const before = engine.getRuntimeSnapshot();

      engine.configure({ ...config, mutedParts: { strings: true, rhythm: true } });
      await flushMusicPromises();
      expect(engine.getRuntimeSnapshot().piece).toBe(before.piece);
      expect(engine.getRuntimeSnapshot().lineup).toEqual([]);

      engine.skipToNextPiece();
      await flushMusicPromises();
      expect(engine.getRuntimeSnapshot().piece).toEqual(generateMusicPiece({ ...config, pieceIndex: 1 }));
      expect(engine.getRuntimeSnapshot().status).toBe("playing");
    } finally {
      engine.dispose();
    }
  });

  test("changing the score restarts playback with the configured composition", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      engine.configure(engineConfig("hearth"));
      await engine.start();
      engine.seek(20);

      const config = engineConfig("road");
      engine.configure(config);
      await flushMusicPromises();

      expect(engine.getRuntimeSnapshot().piece).toEqual(generateMusicPiece(config));
      expect(engine.getRuntimeSnapshot().status).toBe("playing");
      expect(engine.getPositionSeconds()).toBeLessThan(1);
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
});
