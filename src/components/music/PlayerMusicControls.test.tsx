import "@/test/register-dom";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getMusicSettings, setMusicEnabled, setMusicControlMode } from "@/audio/musicSettings";
import { resetMusicLibraryForTests } from "@/audio/musicLibrary";
import { reloadMusicSettingsFromStorage } from "@/test/music-settings";
import { PlayerMusicControls } from "./PlayerMusicControls";

describe("Lilt studio", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadMusicSettingsFromStorage();
    resetMusicLibraryForTests();
  });
  afterEach(cleanup);
  async function renderStudio() {
    render(<PlayerMusicControls />);
    await act(async () => {});
  }
  test("starts quietly with an accessible player and generated cover", async () => {
    await renderStudio();
    expect(getMusicSettings().enabled).toBe(false);
    expect(screen.getByRole("button", { name: "Play music" })).toBeTruthy();
    expect(screen.getByRole("img", { name: /^Cover of / })).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Track progress" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Next song" }) as HTMLButtonElement).disabled).toBe(true);
  });
  test("locks composition until playback and manual direction are enabled", async () => {
    await renderStudio();
    expect((screen.getByRole("combobox", { name: "Music theme" }) as HTMLButtonElement).disabled).toBe(true);
    act(() => {
      setMusicEnabled(true);
      setMusicControlMode("override");
    });
    expect((screen.getByRole("combobox", { name: "Music theme" }) as HTMLButtonElement).disabled).toBe(false);
  });
  test("opens the library and persists the system-media preference", async () => {
    await renderStudio();
    fireEvent.click(screen.getByRole("tab", { name: "Your library" }));
    expect(screen.getByRole("searchbox", { name: "Search music library" })).toBeTruthy();
    const controls = screen.getByRole("switch", { name: "Show music in system controls" });
    fireEvent.click(controls);
    expect(getMusicSettings().systemMediaControls).toBe(false);
  });
});
