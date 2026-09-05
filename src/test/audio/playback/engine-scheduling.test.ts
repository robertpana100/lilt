import { describe, expect, test } from "vitest";
import { generateMusicPiece } from "@/audio/composition/generator";
import { cloneMusicEffects, DEFAULT_MUSIC_EFFECTS } from "@/audio/synthesis/effects/config";
import { varyMusicEffects } from "@/audio/synthesis/effects/variation";
import { engineConfig } from "../tavern-music.test-support";

import {
  fakeAudioContext,
  fakeTimers,
  flushMusicPromises,
  readyEngine,
  runThroughGap,
  runToPieceEnd,
  tickScheduler,
} from "./engine.test-support";

describe("procedural-lute scheduling and effects", () => {
  test("publishes the opening section once the score clock starts", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      const seen: string[] = [];
      engine.subscribeRuntime(() => seen.push(engine.getRuntimeSnapshot().status));
      await engine.start();

      const snapshot = engine.getRuntimeSnapshot();
      expect(snapshot.status).toBe("playing");
      expect(snapshot.sectionId).toBe(generateMusicPiece(engineConfig("hearth")).sections[0]!.id);
      expect(seen).toContain("playing");
    } finally {
      engine.dispose();
    }
  });

  test("holds the authored gap before the next piece and reports it", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      await engine.start();
      const first = engine.getRuntimeSnapshot();
      await runToPieceEnd(engine, audio, timers);
      expect(engine.getRuntimeSnapshot()).toMatchObject({ status: "gap", sectionId: null });

      await runThroughGap(engine, audio, timers);
      expect(engine.getRuntimeSnapshot().status).toBe("playing");
      expect(engine.getRuntimeSnapshot().pieceIndex).toBe(first.pieceIndex + 1);
    } finally {
      engine.dispose();
    }
  });

  test("a skip leaves the current piece without playing the gap", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      await engine.start();
      const first = engine.getRuntimeSnapshot();
      const seen: string[] = [];
      engine.subscribeRuntime(() => seen.push(engine.getRuntimeSnapshot().status));

      engine.skipToNextPiece();
      await flushMusicPromises();

      expect(engine.getRuntimeSnapshot().status).toBe("playing");
      expect(engine.getRuntimeSnapshot().pieceIndex).toBe(first.pieceIndex + 1);
      expect(seen).not.toContain("gap");
    } finally {
      engine.dispose();
    }
  });

  test("varies the effects rack per generated piece from the session's settings", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      await engine.start();
      const opening = varyMusicEffects(DEFAULT_MUSIC_EFFECTS, engine.getRuntimeSnapshot().performanceSeed);
      expect(opening.tone.highGainDb).not.toBe(DEFAULT_MUSIC_EFFECTS.tone.highGainDb);
      expect(audio.targetValues).toContain(opening.tone.lowGainDb);
      expect(audio.targetValues).toContain(opening.tone.highGainDb);

      engine.skipToNextPiece();
      await flushMusicPromises();
      const next = varyMusicEffects(DEFAULT_MUSIC_EFFECTS, engine.getRuntimeSnapshot().performanceSeed);
      expect(audio.targetValues).toContain(next.tone.lowGainDb);
      expect(next.tone.lowGainDb).not.toBe(opening.tone.lowGainDb);
    } finally {
      engine.dispose();
    }
  });

  test("seeks within the sounding take without presenting a new piece", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      await engine.start();
      const before = engine.getRuntimeSnapshot();

      engine.seek(before.durationSeconds * 0.5);
      const after = engine.getRuntimeSnapshot();
      const position = engine.getPositionSeconds();
      expect(after.piece).toBe(before.piece);
      expect(position).toBeGreaterThan(before.durationSeconds * 0.4);
      expect(position).toBeLessThan(before.durationSeconds * 0.6);
      const piece = before.piece;
      const expected = piece.sections.find(
        (section) =>
          position >= section.startPulse * piece.pulseSeconds &&
          position < (section.startPulse + section.lengthPulses) * piece.pulseSeconds,
      );
      expect(after.sectionId).toBe(expected?.id ?? null);

      // The take keeps playing from the sought position.
      await tickScheduler(audio, timers, 1);
      expect(engine.getRuntimeSnapshot().status).toBe("playing");
      expect(engine.getPositionSeconds()).toBeGreaterThan(position);

      // Seeking far past the end clamps into the piece instead of past it;
      // landing on its final pulse, the take finishes into its gap.
      engine.seek(1e6);
      expect(engine.getPositionSeconds()).toBeLessThanOrEqual(engine.getRuntimeSnapshot().durationSeconds);
    } finally {
      engine.dispose();
    }
  });

  test("holds the take's written end through its gap instead of rewinding", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      await engine.start();
      const duration = engine.getRuntimeSnapshot().durationSeconds;
      engine.seek(duration - 1);

      const positions: number[] = [];
      let sawGap = false;
      for (let tick = 0; tick < 12; tick += 1) {
        await tickScheduler(audio, timers, 0.5);
        positions.push(engine.getPositionSeconds());
        if (engine.getRuntimeSnapshot().status !== "gap") continue;
        // The authored gap is not part of the take: it has finished, and
        // the position must not rewind by the gap still to come.
        expect(engine.getPositionSeconds()).toBe(duration);
        if (sawGap) break;
        sawGap = true;
      }
      expect(sawGap).toBe(true);
      for (let index = 1; index < positions.length; index += 1) {
        expect(positions[index]!).toBeGreaterThanOrEqual(positions[index - 1]!);
      }
    } finally {
      engine.dispose();
    }
  });

  test("streams position on its own channel without republishing the runtime", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      await engine.start();
      const piece = engine.getRuntimeSnapshot().piece;
      // A section long enough that the scheduler's lookahead stays inside it.
      const section = piece.sections.find((candidate) => {
        const span = (candidate.lengthPulses - candidate.bridgePulses) * piece.pulseSeconds;
        return span > 5;
      });
      expect(section).toBeDefined();
      engine.seek(section!.startPulse * piece.pulseSeconds + 1);

      let runtimePublishes = 0;
      const unsubscribe = engine.subscribeRuntime(() => {
        runtimePublishes += 1;
      });
      await tickScheduler(audio, timers, 0.3);
      await tickScheduler(audio, timers, 0.3);
      await tickScheduler(audio, timers, 0.3);
      expect(engine.getPositionSeconds()).toBeGreaterThan(section!.startPulse * piece.pulseSeconds);
      expect(runtimePublishes).toBe(0);
      unsubscribe();
    } finally {
      engine.dispose();
    }
  });

  test("publishes the sounding rack and honors mid-take switch edits", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      await engine.start();
      const opening = engine.getRuntimeSnapshot();
      expect(opening.soundingEffects).toEqual(varyMusicEffects(DEFAULT_MUSIC_EFFECTS, opening.performanceSeed));

      engine.skipToNextPiece();
      await flushMusicPromises();
      const next = engine.getRuntimeSnapshot();
      expect(next.soundingEffects).toEqual(varyMusicEffects(DEFAULT_MUSIC_EFFECTS, next.performanceSeed));

      // Flipping a switch mid-take is audible immediately and reported as
      // part of the sounding rack, lasting until the next piece.
      const edited = cloneMusicEffects(DEFAULT_MUSIC_EFFECTS);
      edited.echo.enabled = false;
      engine.configure({ ...engineConfig(), effects: edited });
      expect(engine.getRuntimeSnapshot().soundingEffects.echo.enabled).toBe(false);
    } finally {
      engine.dispose();
    }
  });

  test("a skip advances the repertoire without turning automatic playback back on", async () => {
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers);

    try {
      engine.configure({ ...engineConfig("hearth"), autoAdvance: false });
      await engine.start();
      const before = engine.getRuntimeSnapshot().pieceIndex;

      engine.skipToNextPiece();
      await flushMusicPromises();
      expect(engine.getRuntimeSnapshot().pieceIndex).toBe(before + 1);

      await runToPieceEnd(engine, audio, timers);
      expect(engine.getRuntimeSnapshot().status).toBe("complete");
    } finally {
      engine.dispose();
    }
  });
});
