import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({ seek: vi.fn(), position: 20, runtime: { status: "playing" } }));
vi.mock("@/audio/playback/react", () => ({
  useMusicPosition: () => mocks.position,
  useMusicRuntime: () => mocks.runtime,
  useMusicSessionController: () => ({ seek: mocks.seek }),
}));
import { TrackProgress } from "./TrackProgress";

describe("player seeking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.position = 20;
    mocks.runtime.status = "playing";
  });
  afterEach(cleanup);

  test("previews a pointer scrub and seeks only when released", () => {
    render(<TrackProgress duration={100} />);
    const slider = screen.getByRole("slider", { name: "Music position" });
    fireEvent.change(slider, { target: { value: "40" } });
    expect(screen.getByText("0:40")).toBeTruthy();
    expect(mocks.seek).not.toHaveBeenCalled();
    fireEvent.pointerUp(slider);
    expect(mocks.seek).toHaveBeenCalledExactlyOnceWith(40);
  });

  test("supports keyboard seeking and commits an edit when focus leaves", () => {
    render(<TrackProgress duration={100} />);
    const slider = screen.getByRole("slider", { name: "Music position" });
    fireEvent.change(slider, { target: { value: "25" } });
    fireEvent.keyUp(slider, { key: "ArrowRight" });
    expect(mocks.seek).toHaveBeenLastCalledWith(25);
    fireEvent.change(slider, { target: { value: "50" } });
    fireEvent.blur(slider);
    expect(mocks.seek).toHaveBeenLastCalledWith(50);
  });

  test("cancels an interrupted scrub and disables seeking while paused", () => {
    const view = render(<TrackProgress duration={100} />);
    const slider = screen.getByRole("slider", { name: "Music position" }) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "60" } });
    fireEvent.pointerCancel(slider);
    expect(mocks.seek).not.toHaveBeenCalled();
    expect(slider.valueAsNumber).toBe(20);
    mocks.runtime.status = "stopped";
    view.rerender(<TrackProgress duration={100} />);
    expect(slider.disabled).toBe(true);
  });
});
