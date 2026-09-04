import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { getMusicApplication } from "@/audio/application";
import { getMusicSettings, setMusicControlMode } from "@/audio/musicSettings";
import { reloadMusicSettingsFromStorage } from "@/test/music-settings";
import SoundDesk from "./SoundDesk";

describe("sound desk", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadMusicSettingsFromStorage();
  });
  afterEach(cleanup);
  async function renderDesk() {
    render(<SoundDesk />);
    await act(async () => {});
  }
  test("requires taking manual direction before editing an automatic or favourite programme", async () => {
    await renderDesk();
    expect(screen.queryByLabelText("Master seed")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Take the lead" }));
    expect(getMusicSettings().controlMode).toBe("override");
    expect(screen.getByLabelText("Master seed")).toBeTruthy();
  });
  test("edits the real composition seed and exposes registry-driven form choices", async () => {
    setMusicControlMode("override");
    await renderDesk();
    fireEvent.change(screen.getByLabelText("Master seed"), { target: { value: "4253" } });
    expect(getMusicApplication().session.getState().masterSeed).toBe(4253);
    expect(screen.getByRole("combobox", { name: "Music form lock" })).toBeTruthy();
    // Happy DOM has no layout: Base UI hides its thumb until it can measure it.
    // The real-browser check verifies visibility; here verify the named native input.
    expect(screen.getByLabelText("Studio music tempo")).toBeTruthy();
    expect(screen.getByLabelText("Music humanization")).toBeTruthy();
  });
  test("controls the real mute flags, effects bypass, and paused seeking", async () => {
    setMusicControlMode("override");
    await renderDesk();
    const session = getMusicApplication().session;
    fireEvent.click(screen.getByRole("tab", { name: "Instruments" }));
    const previouslyMuted = session.getState().mutedParts.rhythm;
    fireEvent.click(screen.getByRole("switch", { name: "Enable rhythm lute" }));
    expect(session.getState().mutedParts.rhythm).toBe(!previouslyMuted);
    expect(screen.getByRole("combobox", { name: "Chord audition lute body" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Effects" }));
    const previousBypass = session.getState().effects.bypassed;
    fireEvent.click(screen.getByRole("switch", { name: "Bypass all music effects" }));
    expect(session.getState().effects.bypassed).toBe(!previousBypass);
    fireEvent.click(screen.getByRole("tab", { name: "Playback" }));
    expect((screen.getByLabelText("Music position") as HTMLInputElement).disabled).toBe(true);
  });
});
