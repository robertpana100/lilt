import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { MusicSettings } from "@/audio/musicSettings";
import type { MusicRuntimeSnapshot } from "@/audio/playback/types";

const mocks = vi.hoisted(() => {
  const detachApplication = vi.fn();
  const unsubscribeRuntime = vi.fn();
  const playback = {
    peekRuntimeSnapshot: vi.fn(() => null as MusicRuntimeSnapshot | null),
    getRuntimeSnapshot: vi.fn(() => ({}) as MusicRuntimeSnapshot),
    subscribeRuntime: vi.fn(() => unsubscribeRuntime),
  };
  const application = { playback, unlock: vi.fn(async () => true), attach: vi.fn(() => detachApplication) };
  const media = {
    attach: vi.fn(),
    detach: vi.fn(),
    dispose: vi.fn(),
    sync: vi.fn(),
  };
  return {
    application,
    detachApplication,
    media,
    settings: {
      enabled: true,
      volume: 0.35,
      controlMode: "auto",
    } as MusicSettings,
    playback,
    unsubscribeRuntime,
  };
});

vi.mock("@/audio/application", () => ({ getMusicApplication: () => mocks.application }));
vi.mock("@/audio/musicSettings", () => ({
  getMusicSettings: () => mocks.settings,
  useMusicSettings: () => mocks.settings,
}));
vi.mock("@/audio/system-media", () => ({ getSystemMediaSession: () => mocks.media }));

import { ProceduralMusic } from "@/audio/ProceduralMusic";

describe("procedural music browser host", () => {
  afterEach(() => vi.restoreAllMocks());

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.settings.enabled = true;
    mocks.settings.controlMode = "auto";
    mocks.application.unlock.mockResolvedValue(true);
    mocks.playback.peekRuntimeSnapshot.mockReturnValue(null);
    mocks.application.attach.mockReturnValue(mocks.detachApplication);
    mocks.playback.subscribeRuntime.mockReturnValue(mocks.unsubscribeRuntime);
  });

  test("owns media, playback, gesture unlock, and cleanup for its mounted lifetime", async () => {
    const view = render(<ProceduralMusic />);

    expect(mocks.application.attach).toHaveBeenCalledOnce();
    expect(mocks.media.attach).toHaveBeenCalledOnce();
    expect(mocks.playback.subscribeRuntime).toHaveBeenCalledOnce();

    fireEvent.pointerDown(window);
    await waitFor(() => expect(mocks.application.unlock).toHaveBeenCalledOnce());
    fireEvent.keyDown(window);
    expect(mocks.application.unlock).toHaveBeenCalledOnce();

    view.unmount();
    expect(mocks.unsubscribeRuntime).toHaveBeenCalledOnce();
    expect(mocks.media.detach).toHaveBeenCalled();
    expect(mocks.detachApplication).toHaveBeenCalledOnce();
    expect(mocks.media.dispose).toHaveBeenCalledOnce();
  });

  test("backs failed unlock attempts off instead of retrying on every gesture", async () => {
    let now = 100;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    mocks.application.unlock.mockResolvedValue(false);
    const view = render(<ProceduralMusic />);

    fireEvent.pointerDown(window);
    await waitFor(() => expect(mocks.application.unlock).toHaveBeenCalledOnce());
    await act(async () => undefined);
    fireEvent.keyDown(window);
    expect(mocks.application.unlock).toHaveBeenCalledOnce();

    now = 5_101;
    fireEvent.keyDown(window);
    await waitFor(() => expect(mocks.application.unlock).toHaveBeenCalledTimes(2));
    view.unmount();
  });
});
