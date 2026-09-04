import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({ unlock: vi.fn(), skip: vi.fn(), runtime: { status: "stopped" } }));
vi.mock("@/audio/application", () => ({ getMusicApplication: () => ({ unlock: mocks.unlock }) }));
vi.mock("@/audio/playback/react", () => ({
  useMusicRuntime: () => mocks.runtime,
  useMusicSessionController: () => ({ skipToNextPiece: mocks.skip }),
}));
import { getMusicSettings } from "@/audio/musicSettings";
import { dismissNotification } from "@/app/notifications/store";
import { NotificationBanner } from "@/app/notifications/NotificationBanner";
import { reloadMusicSettingsFromStorage } from "@/test/music-settings";
import { MusicTransport } from "./MusicTransport";
describe("explicit playback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    reloadMusicSettingsFromStorage();
    dismissNotification();
    mocks.runtime.status = "stopped";
  });
  afterEach(cleanup);
  test("retries a suspended session even when playback was already enabled", async () => {
    mocks.unlock.mockResolvedValue(true);
    render(<MusicTransport enabled volume={0.35} />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Play music" })));
    expect(mocks.unlock).toHaveBeenCalledOnce();
    expect(getMusicSettings().enabled).toBe(true);
  });
  test("shows a recoverable error when audio cannot be unlocked", async () => {
    mocks.unlock.mockResolvedValue(false);
    render(
      <>
        <MusicTransport enabled={false} volume={0.35} />
        <NotificationBanner />
      </>,
    );
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Play music" })));
    expect(screen.getByText("Audio could not start. Press Play to try again.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play music" })).toBeTruthy();
  });
  test("pauses a sounding take through the persisted setting", () => {
    mocks.runtime.status = "playing";
    render(<MusicTransport enabled volume={0.35} />);
    fireEvent.click(screen.getByRole("button", { name: "Pause music" }));
    expect(getMusicSettings().enabled).toBe(false);
    expect(mocks.unlock).not.toHaveBeenCalled();
  });
});
