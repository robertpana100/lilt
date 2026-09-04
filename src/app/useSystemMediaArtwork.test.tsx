import { getAppearanceStore } from "@/appearance/browser";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  peek: vi.fn(),
  unsubscribe: vi.fn(),
  subscribe: vi.fn(),
  setArtwork: vi.fn(),
  render: vi.fn(),
  publish: null as null | (() => void),
}));
vi.mock("@/audio/application", () => ({
  getMusicApplication: () => ({ playback: { peekRuntimeSnapshot: mocks.peek, subscribeRuntime: mocks.subscribe } }),
}));
vi.mock("@/audio/system-media", () => ({ getSystemMediaSession: () => ({ setArtwork: mocks.setArtwork }) }));
vi.mock("@/audio/cover-art", () => ({ coverArtImage: mocks.render }));
import { COVER_COLORS } from "@/appearance/cover-colors";
import { useSystemMediaArtwork } from "./useSystemMediaArtwork";
describe("standalone media artwork", () => {
  beforeEach(() => {
    getAppearanceStore().setPreference("light");
    vi.clearAllMocks();
    mocks.publish = null;
    mocks.peek.mockReturnValue(null);
    mocks.subscribe.mockImplementation((publish: () => void) => {
      mocks.publish = publish;
      return mocks.unsubscribe;
    });
    mocks.render.mockReturnValue({ key: "take-one", url: "data:image/png;base64,one" });
  });
  afterEach(cleanup);
  test("does not compose a silent session just to draw a cover", () => {
    renderHook(() => useSystemMediaArtwork());
    expect(mocks.peek).toHaveBeenCalledOnce();
    expect(mocks.render).not.toHaveBeenCalled();
    expect(mocks.subscribe).toHaveBeenCalledOnce();
  });
  test("uses Lilt colours, redraws only a changed take, and detaches on unmount", () => {
    const take = { name: "A small song" };
    mocks.peek.mockReturnValue(take);
    const hook = renderHook(() => useSystemMediaArtwork());
    expect(mocks.render).toHaveBeenCalledWith(take, COVER_COLORS.light);
    expect(mocks.setArtwork).toHaveBeenCalledWith("data:image/png;base64,one");
    act(() => mocks.publish?.());
    expect(mocks.setArtwork).toHaveBeenCalledOnce();
    mocks.render.mockReturnValue({ key: "take-two", url: "data:image/png;base64,two" });
    act(() => mocks.publish?.());
    expect(mocks.setArtwork).toHaveBeenLastCalledWith("data:image/png;base64,two");
    hook.unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    expect(mocks.subscribe).toHaveBeenCalledOnce();
  });
  test("updates artwork colors when the appearance changes", () => {
    const take = { name: "A small song" };
    mocks.peek.mockReturnValue(take);
    mocks.render.mockImplementation((_take, colors) => ({ key: colors.background, url: colors.background }));
    renderHook(() => useSystemMediaArtwork());
    act(() => getAppearanceStore().setPreference("dark"));
    expect(mocks.render).toHaveBeenLastCalledWith(take, COVER_COLORS.dark);
    expect(mocks.setArtwork).toHaveBeenLastCalledWith(COVER_COLORS.dark.background);
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
  });
});
