import { describe, expect, test, vi } from "vitest";
import { MusicApplication } from "./application";
import type { MusicPlaybackPort } from "./playback/port";
import { MusicSession } from "./playback/session-controller";
import { createInitialMusicSessionState } from "./playback/session-state";
import type { MusicSettings } from "./musicSettings";
import type { MusicEngineConfig, MusicRuntimeSnapshot } from "./playback/types";
import { getMusicRoot } from "./composition/roots";

const SETTINGS: MusicSettings = {
  enabled: true,
  volume: 0.4,
  controlMode: "auto",
};

function fakePlayback() {
  let director: ((config: MusicEngineConfig) => MusicEngineConfig) | null = null;
  const engine: MusicPlaybackPort = {
    start: vi.fn(async () => undefined),
    stop: vi.fn(),
    setVolume: vi.fn(),
    configure: vi.fn(),
    skipToNextPiece: vi.fn(),
    seek: vi.fn(),
    setPieceDirector: vi.fn((next) => {
      director = next;
    }),
    subscribeRuntime: vi.fn(() => () => undefined),
    getRuntimeSnapshot: vi.fn(() => ({ pieceIndex: 0 }) as MusicRuntimeSnapshot),
    peekRuntimeSnapshot: vi.fn(() => null),
    subscribePosition: vi.fn(() => () => undefined),
    getPositionSeconds: vi.fn(() => 0),
    isAudible: vi.fn(() => false),
    dispose: vi.fn(),
  };
  return { engine, getDirector: () => director };
}

describe("music application ownership", () => {
  test("constructs deterministically without attaching external behavior", () => {
    const host = fakePlayback();
    const subscribeSettings = vi.fn(() => vi.fn());
    const application = new MusicApplication({
      playback: host.engine,
      pick: () => 0,
      randomSeed: () => 42,
      getSettings: () => SETTINGS,
      subscribeSettings,
    });

    expect(application.session.getState()).toMatchObject({ rootId: "hearth", masterSeed: 42 });
    expect(host.engine.start).not.toHaveBeenCalled();
    expect(host.engine.setPieceDirector).not.toHaveBeenCalled();
    expect(subscribeSettings).not.toHaveBeenCalled();
  });

  test("owns settings, director, and engine for exactly its attached lifetime", async () => {
    const host = fakePlayback();
    const detachSettings = vi.fn();
    let settingsListener: () => void = () => undefined;
    const application = new MusicApplication({
      playback: host.engine,
      initialState: createInitialMusicSessionState({ pick: () => 0, randomSeed: () => 7 }),
      getSettings: () => SETTINGS,
      subscribeSettings: (listener) => {
        settingsListener = listener;
        return detachSettings;
      },
    });

    const detachFirst = application.attach();
    const detachSecond = application.attach();
    await Promise.resolve();

    expect(host.getDirector()).toBeTypeOf("function");
    expect(host.engine.setVolume).toHaveBeenCalledWith(SETTINGS.volume);
    expect(host.engine.start).toHaveBeenCalledTimes(1);

    settingsListener();
    await Promise.resolve();
    expect(host.engine.start).toHaveBeenCalledTimes(2);

    detachFirst();
    expect(host.engine.dispose).not.toHaveBeenCalled();
    detachSecond();

    expect(detachSettings).toHaveBeenCalledOnce();
    expect(host.getDirector()).toBeNull();
    expect(host.engine.dispose).toHaveBeenCalledOnce();
  });

  test("reattaches cleanly across a Strict Mode mount-cleanup-mount lifecycle", async () => {
    const host = fakePlayback();
    const detachObservers: Array<ReturnType<typeof vi.fn>> = [];
    const application = new MusicApplication({
      playback: host.engine,
      initialState: createInitialMusicSessionState({ pick: () => 0, randomSeed: () => 11 }),
      getSettings: () => SETTINGS,
      subscribeSettings: () => {
        const detach = vi.fn();
        detachObservers.push(detach);
        return detach;
      },
    });

    const detachProbeMount = application.attach();
    await Promise.resolve();
    detachProbeMount();

    const detachRealMount = application.attach();
    await Promise.resolve();
    detachRealMount();
    detachProbeMount();

    expect(host.engine.start).toHaveBeenCalledTimes(2);
    expect(host.engine.dispose).toHaveBeenCalledTimes(2);
    expect(host.engine.setPieceDirector).toHaveBeenCalledTimes(4);
    expect(detachObservers).toHaveLength(2);
    expect(detachObservers.every((detach) => detach.mock.calls.length === 1)).toBe(true);
  });

  test("keeps debounced edits inside the session and cancels them on stop", () => {
    const host = fakePlayback();
    const callbacks = new Map<number, () => void>();
    let handle = 0;
    const session = new MusicSession(
      host.engine,
      createInitialMusicSessionState({ pick: () => 0, randomSeed: () => 3 }),
      {
        getControlMode: () => "auto",
        scheduleTimeout: (callback) => {
          handle += 1;
          callbacks.set(handle, callback);
          return handle as unknown as ReturnType<typeof setTimeout>;
        },
        cancelTimeout: (timer) => callbacks.delete(timer as unknown as number),
      },
    );

    session.start();
    vi.mocked(host.engine.configure).mockClear();
    session.setNovelty(0.9);
    expect(host.engine.configure).not.toHaveBeenCalled();
    session.stop();
    expect(callbacks.size).toBe(0);
    expect(host.engine.configure).not.toHaveBeenCalled();
    session.start();
    expect(host.engine.configure).toHaveBeenCalledWith(expect.objectContaining({ novelty: 0.9 }));
  });

  test("normalizes every independently editable rendering concern", () => {
    const host = fakePlayback();
    const callbacks: Array<() => void> = [];
    const initial = createInitialMusicSessionState({ pick: () => 0, randomSeed: () => 3 });
    const session = new MusicSession(host.engine, initial, {
      getControlMode: () => "override",
      randomSeed: () => 99,
      scheduleTimeout: (callback) => {
        callbacks.push(callback);
        return callbacks.length as unknown as ReturnType<typeof setTimeout>;
      },
      cancelTimeout: vi.fn(),
    });
    const root = getMusicRoot(initial.rootId);

    session.setBpm(10_000);
    expect(session.getState().bpm).toBe(root.tempo.max);
    callbacks.at(-1)?.();
    expect(host.engine.configure).toHaveBeenLastCalledWith(expect.objectContaining({ bpm: root.tempo.max }));

    session.setChords({ amount: -1, strumMs: 99 });
    session.setRhythmLute({ density: 2, level: 2, strumMs: 99 });
    session.setHumanization(2);
    session.setFormOverride(root.forms[0] ?? null);
    session.setTonicOverride(root.safeTonics[0] ?? null);
    session.setAutoAdvance(false);
    session.setPartMuted("rhythm", true);
    session.setEffectsBypassed(true);
    session.setEffect("tone", { lowGainDb: 99 });

    expect(session.getState()).toMatchObject({
      chords: { amount: 0, strumMs: 40 },
      rhythmLute: { density: 1, level: 1, strumMs: 40 },
      humanization: 1,
      formOverride: root.forms[0] ?? null,
      tonicOverride: root.safeTonics[0] ?? null,
      autoAdvance: false,
      mutedParts: { rhythm: true },
      effects: { bypassed: true, tone: { lowGainDb: 12 } },
    });

    session.newComposition();
    session.newVariation();
    session.newPerformance();
    expect(session.getState()).toMatchObject({ masterSeed: 99, variationIndex: 1, performanceIndex: 1 });

    session.resetChords();
    session.resetRhythmLute();
    session.resetEffects();
    session.reset();
    expect(session.getState()).toEqual(initial);
  });

  test("owns preference application and gesture unlock policy", async () => {
    const host = fakePlayback();
    const settings = { ...SETTINGS, enabled: false };
    const application = new MusicApplication({
      playback: host.engine,
      getSettings: () => settings,
      subscribeSettings: () => () => undefined,
    });

    expect(await application.unlock()).toBe(false);
    expect(host.engine.start).not.toHaveBeenCalled();

    settings.enabled = true;
    vi.mocked(host.engine.isAudible).mockReturnValue(true);
    expect(await application.unlock()).toBe(true);
    expect(host.engine.setVolume).toHaveBeenCalledWith(settings.volume);
    expect(host.engine.start).toHaveBeenCalledOnce();
  });
});
