import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { getMusicApplication } from "@/audio/application";
import { getMusicSettings, setMusicControlMode } from "@/audio/musicSettings";
import { reloadMusicSettingsFromStorage } from "@/test/music-settings";
import SoundDesk from "./SoundDesk";

async function openSection(title: string) {
  fireEvent.click(screen.getByText(title, { selector: "summary" }));
  await act(async () => {});
}

describe("sound desk", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadMusicSettingsFromStorage();
    getMusicApplication().session.reset();
  });
  afterEach(cleanup);

  test("shows manual controls only on request without changing the composition", () => {
    render(<SoundDesk />);
    const before = getMusicApplication().session.getState();
    const direction = screen.getByRole("combobox", { name: "Music direction" });
    expect(
      within(direction)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Automatic", "Manual"]);
    expect(screen.queryByRole("combobox", { name: "Music root" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Effects" })).toBeNull();

    fireEvent.change(direction, { target: { value: "override" } });
    expect(getMusicSettings().controlMode).toBe("override");
    expect(screen.getByRole("combobox", { name: "Music root" })).toBeTruthy();
    expect(screen.queryByLabelText("Master seed")).toBeNull();

    fireEvent.change(direction, { target: { value: "auto" } });
    expect(screen.queryByRole("combobox", { name: "Music root" })).toBeNull();
    expect(getMusicApplication().session.getState()).toBe(before);
  });

  test("edits the real seed, tempo and form through native controls", async () => {
    setMusicControlMode("override");
    render(<SoundDesk />);
    const controller = getMusicApplication().session;
    fireEvent.change(screen.getByRole("combobox", { name: "Music root" }), { target: { value: "road" } });
    expect(controller.getState().rootId).toBe("road");
    fireEvent.change(screen.getByRole("slider", { name: "Studio music tempo" }), { target: { value: "100" } });
    expect(controller.getState().bpm).toBe(100);
    await openSection("Composition");
    await waitFor(() => expect(screen.getByLabelText("Master seed")).toBeTruthy());
    fireEvent.change(screen.getByLabelText("Master seed"), { target: { value: "4253" } });
    expect(controller.getState().masterSeed).toBe(4253);
    const form = screen.getByRole("combobox", { name: "Music form lock" });
    const option = within(form).getAllByRole("option")[1] as HTMLOptionElement;
    fireEvent.change(form, { target: { value: option.value } });
    expect(controller.getState().formOverride).toBe(option.value);
  });

  test("keeps instrument and audition controls in closed native disclosures", async () => {
    setMusicControlMode("override");
    render(<SoundDesk />);
    expect(screen.queryByRole("checkbox", { name: "Enable rhythm lute" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Chord audition lute body" })).toBeNull();
    await openSection("Instruments");
    const control = await screen.findByRole("checkbox", { name: "Enable rhythm lute" });
    const session = getMusicApplication().session;
    const before = session.getState().mutedParts.rhythm;
    fireEvent.click(control);
    expect(session.getState().mutedParts.rhythm).toBe(!before);
    expect(screen.queryByRole("slider", { name: "Music rhythm lute level" })).toBeNull();
    await openSection("Audition");
    expect(await screen.findByRole("combobox", { name: "Chord audition lute body" })).toBeTruthy();
    await openSection("Audition");
    await waitFor(() => expect(screen.queryByRole("combobox", { name: "Chord audition lute body" })).toBeNull());
  });
});
