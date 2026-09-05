import "@/test/register-dom";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { getMusicSettings, setMusicControlMode } from "@/audio/musicSettings";
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
    expect(screen.getByRole("slider", { name: "Music position" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Randomize song" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByText("Library")).toBeNull();
    expect(screen.queryByRole("button", { name: /MIDI/ })).toBeNull();
    expect(screen.queryByLabelText("Show music in system controls")).toBeNull();
  });
  test("keeps the automatic player free of manual controls", async () => {
    await renderStudio();
    expect(screen.queryByRole("combobox", { name: "Music root" })).toBeNull();
    act(() => {
      setMusicControlMode("override");
    });
    expect((screen.getByRole("combobox", { name: "Music root" }) as HTMLSelectElement).disabled).toBe(false);
    expect(screen.queryByRole("button", { name: "Random atmosphere" })).toBeNull();
  });
});
