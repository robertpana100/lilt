import "@/test/register-dom";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getMusicSettings, setMusicEnabled, setMusicControlMode } from "@/audio/musicSettings";
import { reloadMusicSettingsFromStorage } from "@/test/music-settings";
import { PlayerMusicControls } from "./PlayerMusicControls";

describe("Lilt studio", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadMusicSettingsFromStorage();
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
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByText("Library")).toBeNull();
    expect(screen.queryByRole("button", { name: /MIDI/ })).toBeNull();
  });
  test("shows composition controls while manual editing is disabled", async () => {
    await renderStudio();
    expect((screen.getByLabelText("Master seed").closest("fieldset") as HTMLFieldSetElement).disabled).toBe(true);
    act(() => {
      setMusicEnabled(true);
      setMusicControlMode("override");
    });
    expect((screen.getByRole("combobox", { name: "Music root" }) as HTMLButtonElement).disabled).toBe(false);
  });
  test("persists the system-media preference", async () => {
    await renderStudio();
    expect(screen.queryByRole("tab")).toBeNull();
    const controls = screen.getByRole("switch", { name: "Show music in system controls" });
    fireEvent.click(controls);
    expect(getMusicSettings().systemMediaControls).toBe(false);
  });
});
