import { afterEach, describe, expect, test } from "vitest";
import { recordAudiblePieces } from "../library/playback-observer";
import { getMusicHistory, resetMusicLibraryForTests } from "../musicLibrary";
import { DEFAULT_MUSIC_EFFECTS } from "../synthesis/effects/config";
import { engineConfig } from "../tavern-music.test-support";
import { TavernMusicEngine } from "./engine";

import {
  fakeAudioContext,
  fakeTimers,
  flushMusicPromises,
  readyEngine,
  runThroughGap,
  runToPieceEnd,
  tickScheduler,
} from "./engine.test-support";

describe("procedural-lute lifecycle and history", () => {
  afterEach(resetMusicLibraryForTests);

  test("stops notifying a runtime subscriber after it unsubscribes", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      let notifications = 0;
      const unsubscribe = engine.subscribeRuntime(() => {
        notifications += 1;
      });
      await engine.start();
      expect(notifications).toBeGreaterThan(0);

      unsubscribe();
      const settled = notifications;
      engine.stop();
      expect(notifications).toBe(settled);
    } finally {
      engine.dispose();
    }
  });

  test("a resume after stop abandons the bus still holding the scheduled tail", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      await engine.start();
      // Up to the scheduler lookahead of notes is already scheduled on this
      // bus; a stop leaves them in place, so a resume must not reuse the bus.
      const busesAfterStart = audio.gains.filter((entry) => entry.starts.length > 0).length;
      expect(busesAfterStart).toBeGreaterThan(0);

      engine.stop();
      await engine.start();
      await flushMusicPromises();

      const busesAfterResume = audio.gains.filter((entry) => entry.starts.length > 0).length;
      expect(busesAfterResume).toBeGreaterThan(busesAfterStart);
      // The abandoned bus is released rather than left connected.
      expect([...timers.timeouts.values()].some((entry) => entry.delay === 500)).toBe(true);
      expect(engine.getRuntimeSnapshot().status).toBe("playing");
    } finally {
      engine.dispose();
    }
  });

  test("a rejected resume cannot overwrite a later stop with an error", async () => {
    const audio = fakeAudioContext({ deferResume: true });
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      const starting = engine.start();
      engine.stop();
      audio.rejectResume(new Error("resume cancelled"));
      await starting;

      expect(engine.getRuntimeSnapshot().status).toBe("stopped");
    } finally {
      engine.dispose();
    }
  });

  test("live effect changes keep the current score and piece bus", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      engine.configure(engineConfig("hearth"));
      await engine.start();
      const before = engine.getRuntimeSnapshot();
      const busesBefore = audio.gains.filter((entry) => entry.starts.length > 0).length;

      engine.configure({
        ...engineConfig("hearth"),
        effects: {
          ...DEFAULT_MUSIC_EFFECTS,
          chorus: { ...DEFAULT_MUSIC_EFFECTS.chorus, mix: 0.4 },
        },
      });

      const after = engine.getRuntimeSnapshot();
      const busesAfter = audio.gains.filter((entry) => entry.starts.length > 0).length;
      expect(after).toMatchObject({
        name: before.name,
        pieceIndex: before.pieceIndex,
        status: "playing",
      });
      expect(busesAfter).toBe(busesBefore);
    } finally {
      engine.dispose();
    }
  });

  test("a finished piece is announced once, not on every scheduler tick", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      engine.configure({ ...engineConfig("hearth"), autoAdvance: false });
      await engine.start();
      let notifications = 0;
      engine.subscribeRuntime(() => {
        notifications += 1;
      });

      await runToPieceEnd(engine, audio, timers);
      expect(engine.getRuntimeSnapshot().status).toBe("complete");
      const announced = notifications;

      await tickScheduler(audio, timers, 1);
      await tickScheduler(audio, timers, 1);
      expect(notifications).toBe(announced);
      // The scheduler stays alive so turning auto-advance back on resumes.
      expect(timers.intervals.size).toBe(1);
    } finally {
      engine.dispose();
    }
  });

  test("play history observes the runtime and records each audible piece start once", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);
    const stopObserving = recordAudiblePieces(engine);

    try {
      expect(getMusicHistory()).toHaveLength(0);
      await engine.start();
      expect(getMusicHistory()).toHaveLength(1);
      expect(getMusicHistory()[0]!.name).toBe(engine.getRuntimeSnapshot().name);

      // Section publishes on later ticks must not pass for new piece starts.
      await tickScheduler(audio, timers, 5);
      expect(getMusicHistory()).toHaveLength(1);

      await runToPieceEnd(engine, audio, timers);
      await runThroughGap(engine, audio, timers);
      expect(engine.getRuntimeSnapshot().status).toBe("playing");
      expect(getMusicHistory()).toHaveLength(2);
    } finally {
      stopObserving();
      engine.dispose();
    }
  });

  test("a music-disabled boot never materializes a runtime snapshot", async () => {
    const timers = fakeTimers();
    const engine = new TavernMusicEngine({ createAudioContext: () => null, ...timers });
    // The wiring a real boot performs: history observation plus the media
    // mirror, both of which react to every publish by peeking, not forcing.
    const stopObserving = recordAudiblePieces(engine);
    const peeks: Array<boolean> = [];
    const unsubscribe = engine.subscribeRuntime(() => peeks.push(engine.peekRuntimeSnapshot() !== null));

    try {
      // Music switched off: the engine is stopped without ever having started.
      engine.setVolume(0.3);
      engine.stop();

      // The stop was published (listeners heard it) yet nothing composed the
      // opening piece to describe it: no snapshot exists to this day.
      expect(peeks).toEqual([false]);
      expect(engine.peekRuntimeSnapshot()).toBeNull();
      expect(getMusicHistory()).toHaveLength(0);
    } finally {
      unsubscribe();
      stopObserving();
      engine.dispose();
    }
  });

  test("stop cancels the recurring scheduler", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = new TavernMusicEngine({ createAudioContext: () => audio.context, ...timers });

    try {
      await engine.start();
      expect(timers.intervals.size).toBe(1);
      engine.stop();
      expect(timers.intervals.size).toBe(0);
    } finally {
      engine.dispose();
    }
  });
});
