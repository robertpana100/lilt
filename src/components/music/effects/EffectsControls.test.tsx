import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { getMusicApplication } from "@/audio/application";
import { EffectsControls } from "./EffectsControls";

const EFFECTS = [
  ["tone", "Tone", 2],
  ["saturation", "Saturation", 2],
  ["chorus", "Chorus", 3],
  ["tremolo", "Tremolo", 2],
  ["echo", "Echo", 3],
  ["reverb", "Reverb", 2],
] as const;

describe("effect controls", () => {
  beforeEach(() => {
    const application = getMusicApplication();
    application.playback.getRuntimeSnapshot();
    application.session.reset();
    for (const [id] of EFFECTS) application.session.setEffect(id, { enabled: false });
  });
  afterEach(cleanup);

  test.each(EFFECTS)("reveals only enabled %s parameters and keeps their values when hidden", (id, name, count) => {
    render(<EffectsControls />);
    expect(screen.queryAllByRole("slider")).toHaveLength(0);
    const group = within(screen.getByRole("group", { name: `${name} effect` }));
    const checkbox = group.getByRole("switch");
    fireEvent.click(checkbox);
    expect(getMusicApplication().session.getState().effects[id].enabled).toBe(true);
    expect(group.getAllByRole("slider")).toHaveLength(count);
    expect(screen.getAllByRole("slider")).toHaveLength(count);
    const slider = group.getAllByRole("slider")[0] as HTMLInputElement;
    const next = (Number(slider.min) + Number(slider.max)) / 2;
    fireEvent.change(slider, { target: { value: String(next) } });
    const configured = getMusicApplication().session.getState().effects[id];
    fireEvent.click(checkbox);
    expect(group.queryAllByRole("slider")).toHaveLength(0);
    fireEvent.click(checkbox);
    expect(getMusicApplication().session.getState().effects[id]).toEqual(configured);
    expect((group.getAllByRole("slider")[0] as HTMLInputElement).valueAsNumber).toBe(next);
  });

  test("bypass hides parameters and restores the configured effects when released", () => {
    getMusicApplication().session.setEffect("tone", { enabled: true, lowGainDb: 4 });
    render(<EffectsControls />);
    const bypass = screen.getByRole("switch", { name: "Effects enabled" });
    fireEvent.click(bypass);
    expect(getMusicApplication().session.getState().effects.bypassed).toBe(true);
    expect(screen.queryAllByRole("slider")).toHaveLength(0);
    expect((screen.getByRole("switch", { name: "Tone" }) as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(bypass);
    expect((screen.getByRole("slider", { name: "Bass" }) as HTMLInputElement).valueAsNumber).toBe(4);
    fireEvent.click(screen.getByRole("button", { name: "Reset effects" }));
    expect(getMusicApplication().session.getState().effects.tone.lowGainDb).toBe(0);
  });
});
