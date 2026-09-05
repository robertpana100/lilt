import { afterEach, describe, expect, test, vi } from "vitest";
import { cloneMusicEffects } from "@/audio/synthesis/effects/config";
import { varyMusicEffects } from "@/audio/synthesis/effects/variation";
import { engineConfig } from "../tavern-music.test-support";
import { MusicAudioContextOwner } from "@/audio/playback/audio-context";
import { fakeAudioContext, fakeTimers, readyEngine } from "./engine.test-support";
import { MusicSession } from "@/audio/playback/session-controller";

describe("composition effect preservation", () => {
  afterEach(() => vi.restoreAllMocks());

  test("a preserved rack still accepts a switch that restores its session default", async () => {
    const initial = engineConfig("hearth");
    const engine = readyEngine(fakeAudioContext(), fakeTimers(), { initialConfig: initial });
    const session = new MusicSession(engine, initial, {
      getControlMode: () => "override",
      randomSeed: () => 9876,
    });
    try {
      session.start();
      await engine.start();
      session.newComposition();
      const effects = engine.getRuntimeSnapshot().soundingEffects;
      const disabled = (["chorus", "echo", "reverb", "tone", "tremolo", "saturation"] as const).find(
        (effect) => !effects[effect].enabled,
      )!;
      expect(disabled).toBeDefined();
      expect(session.getState().effects[disabled].enabled).toBe(true);
      session.setEffect(disabled, { enabled: true });
      expect(engine.getRuntimeSnapshot().soundingEffects[disabled].enabled).toBe(true);
      session.randomize();
      session.resetEffects();
      const reset = engine.getRuntimeSnapshot().soundingEffects;
      for (const effect of ["chorus", "echo", "reverb", "tone", "tremolo", "saturation"] as const) {
        expect(reset[effect].enabled).toBe(initial.effects[effect].enabled);
      }
    } finally {
      session.stop();
      engine.dispose();
    }
  });

  test.each([
    ["unplayed", false],
    ["playing", false],
    ["paused", false],
    ["unplayed", true],
    ["playing", true],
    ["paused", true],
  ] as const)("New composition keeps the %s rack, with manual edits: %s", async (status, edited) => {
    const initial = engineConfig("hearth");
    const audio = fakeAudioContext();
    const timers = fakeTimers();
    const engine = readyEngine(audio, timers, { initialConfig: initial });
    let seed = 8000;
    const session = new MusicSession(engine, initial, {
      getControlMode: () => "override",
      randomSeed: () => ++seed,
    });
    const applyEffects = vi.spyOn(MusicAudioContextOwner.prototype, "setEffects");

    try {
      // React reads the preview before its effect attaches the session.
      const previewEffects = cloneMusicEffects(engine.getRuntimeSnapshot().soundingEffects);
      session.start();
      if (status !== "unplayed") await engine.start();
      expect(engine.getRuntimeSnapshot().soundingEffects).toEqual(previewEffects);
      if (edited) {
        session.setEffect("echo", { enabled: false });
        session.setEffect("tone", { enabled: true, highGainDb: 6 });
        session.setEffectsBypassed(true);
      }
      if (status === "paused") engine.stop();
      const settings = cloneMusicEffects(session.getState().effects);
      const effects = cloneMusicEffects(engine.getRuntimeSnapshot().soundingEffects);

      for (let index = 0; index < 2; index += 1) {
        const before = engine.getRuntimeSnapshot();
        session.newComposition();
        const after = engine.getRuntimeSnapshot();
        expect(after.compositionSeed).not.toBe(before.compositionSeed);
        expect(after.soundingEffects).toEqual(effects);
        expect(after.status).toBe(before.status);
        expect(session.getState().effects).toEqual(settings);
      }

      // Starting or resuming must apply the preserved values to the graph too.
      await engine.start();
      expect(engine.getRuntimeSnapshot().soundingEffects).toEqual(effects);
      expect(applyEffects).toHaveBeenLastCalledWith(effects);
      session.setHumanization(0.9);
      expect(engine.getRuntimeSnapshot().soundingEffects).toEqual(effects);

      // Randomize still deliberately chooses effects for its new performance.
      session.randomize();
      const randomized = engine.getRuntimeSnapshot();
      expect(randomized.soundingEffects).toEqual(varyMusicEffects(settings, randomized.performanceSeed));
      expect(randomized.soundingEffects).not.toEqual(effects);
    } finally {
      session.stop();
      engine.dispose();
    }
  });
});
