import { describe, expect, test, vi } from "vitest";
import type { MusicPlaybackPort } from "./port";
import { MusicSessionLifecycle } from "./session-lifecycle";
import { createInitialMusicSessionState } from "./session-state";
import type { MusicRuntimeSnapshot } from "./types";

function fakePlayback(): MusicPlaybackPort {
  return {
    start: vi.fn(async () => undefined),
    stop: vi.fn(),
    setVolume: vi.fn(),
    configure: vi.fn(),
    skipToNextPiece: vi.fn(),
    seek: vi.fn(),
    setPieceDirector: vi.fn(),
    subscribeRuntime: vi.fn(() => () => undefined),
    getRuntimeSnapshot: vi.fn(() => ({ pieceIndex: 0 }) as MusicRuntimeSnapshot),
    peekRuntimeSnapshot: vi.fn(() => null),
    subscribePosition: vi.fn(() => () => undefined),
    getPositionSeconds: vi.fn(() => 0),
    isAudible: vi.fn(() => false),
    dispose: vi.fn(),
  };
}

describe("music session lifecycle", () => {
  test("attaches one director and hands the latest snapshot to playback on each start", () => {
    const playback = fakePlayback();
    const lifecycle = new MusicSessionLifecycle(playback);
    const first = createInitialMusicSessionState({ pick: () => 0, randomSeed: () => 1 });
    const second = { ...first, novelty: 0.9 };
    const director = () => second;

    lifecycle.start(first, director);
    lifecycle.start(second, director);
    lifecycle.stop();
    lifecycle.start(second, director);

    expect(playback.configure).toHaveBeenNthCalledWith(1, first);
    expect(playback.configure).toHaveBeenNthCalledWith(2, second);
    expect(playback.setPieceDirector).toHaveBeenNthCalledWith(1, director);
    expect(playback.setPieceDirector).toHaveBeenNthCalledWith(2, null);
    expect(playback.setPieceDirector).toHaveBeenNthCalledWith(3, director);
  });

  test("replaces and cancels debounced configuration without leaking timers", () => {
    const playback = fakePlayback();
    const callbacks = new Map<number, () => void>();
    let nextHandle = 0;
    const lifecycle = new MusicSessionLifecycle(playback, {
      scheduleTimeout: (callback) => {
        nextHandle += 1;
        callbacks.set(nextHandle, callback);
        return nextHandle as unknown as ReturnType<typeof setTimeout>;
      },
      cancelTimeout: (handle) => callbacks.delete(handle as unknown as number),
    });
    const initial = createInitialMusicSessionState({ pick: () => 0, randomSeed: () => 1 });
    const latest = { ...initial, novelty: 0.9 };

    lifecycle.configure(initial, true);
    lifecycle.configure(latest, true);
    expect(callbacks.size).toBe(1);
    const pending = callbacks.entries().next().value;
    if (pending) {
      callbacks.delete(pending[0]);
      pending[1]();
    }
    expect(playback.configure).toHaveBeenCalledWith(latest);

    lifecycle.start(initial, () => latest);
    lifecycle.configure(latest, true);
    lifecycle.stop();
    expect(callbacks.size).toBe(0);
  });
});
