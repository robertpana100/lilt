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
  test("requires taking manual direction before editing an automatic programme", async () => {
    await renderDesk();
    expect((screen.getByLabelText("Master seed").closest("fieldset") as HTMLFieldSetElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Enable manual controls" }));
    expect(getMusicSettings().controlMode).toBe("override");
    expect((screen.getByLabelText("Master seed").closest("fieldset") as HTMLFieldSetElement).disabled).toBe(false);
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
  test("offers automatic and manual direction without changing the current composition", async () => {
    await renderDesk();
    const before = getMusicApplication().session.getState();

    fireEvent.click(screen.getByRole("combobox", { name: "Music direction" }));
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Automatic", "Manual"]);
    fireEvent.pointerDown(screen.getByRole("option", { name: "Manual" }), { pointerType: "mouse" });
    fireEvent.click(screen.getByRole("option", { name: "Manual" }));
    expect(getMusicSettings().controlMode).toBe("override");

    fireEvent.click(screen.getByRole("combobox", { name: "Music direction" }));
    fireEvent.pointerDown(screen.getByRole("option", { name: "Automatic" }), { pointerType: "mouse" });
    fireEvent.click(screen.getByRole("option", { name: "Automatic" }));
    expect(getMusicSettings().controlMode).toBe("auto");
    expect(getMusicApplication().session.getState()).toBe(before);
  });
  test("controls the real mute flags, effects bypass, and paused seeking", async () => {
    setMusicControlMode("override");
    await renderDesk();
    const session = getMusicApplication().session;
    const previouslyMuted = session.getState().mutedParts.rhythm;
    fireEvent.click(screen.getByRole("switch", { name: "Enable rhythm lute" }));
    expect(session.getState().mutedParts.rhythm).toBe(!previouslyMuted);
    expect(screen.getByRole("combobox", { name: "Chord audition lute body" })).toBeTruthy();
    const previousBypass = session.getState().effects.bypassed;
    fireEvent.click(screen.getByRole("switch", { name: "Bypass all music effects" }));
    expect(session.getState().effects.bypassed).toBe(!previousBypass);
    expect((screen.getByLabelText("Music position") as HTMLInputElement).disabled).toBe(true);
  });
});
