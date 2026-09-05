import { afterEach, describe, expect, test, vi } from "vitest";
import type { CoverArtBand, CoverArtDesign, CoverArtDevice } from "@/audio/cover-art/design";
import { drawCoverArt, renderCoverArt } from "@/audio/cover-art/render";

const DEVICES: readonly CoverArtDevice[] = ["cross", "lozenge", "quatrefoil", "star", "bars", "spiral"];
const BANDS: readonly CoverArtBand[] = ["plain", "spoked", "studded"];

function design(device: CoverArtDevice, band: CoverArtBand): CoverArtDesign {
  return {
    key: `${device}:${band}`,
    field: "#eee",
    ink: "#222",
    symmetry: 6,
    band,
    device,
    ringWeight: 0.025,
    rotationDegrees: 60,
  };
}

function recordingContext(options: { throwOnFill?: boolean } = {}) {
  const calls: string[] = [];
  const method =
    (name: string) =>
    (..._args: unknown[]) => {
      calls.push(name);
      if (options.throwOnFill && name === "fillRect") throw new Error("canvas failure");
    };
  const target = {
    save: method("save"),
    restore: method("restore"),
    fillRect: method("fillRect"),
    strokeRect: method("strokeRect"),
    translate: method("translate"),
    rotate: method("rotate"),
    beginPath: method("beginPath"),
    arc: method("arc"),
    stroke: method("stroke"),
    fill: method("fill"),
    moveTo: method("moveTo"),
    lineTo: method("lineTo"),
    closePath: method("closePath"),
  };
  return { context: target as unknown as CanvasRenderingContext2D, calls };
}

describe("cover art rendering", () => {
  afterEach(() => vi.restoreAllMocks());

  test("draws every band and form device through a balanced canvas frame", () => {
    for (const band of BANDS) {
      for (const device of DEVICES) {
        const recording = recordingContext();
        drawCoverArt(recording.context, design(device, band), 128);
        expect(recording.calls[0]).toBe("save");
        expect(recording.calls.at(-1)).toBe("restore");
        expect(recording.calls).toContain("arc");
        expect(recording.calls).toContain("fill");
      }
    }
  });

  test("encodes a canvas and degrades cleanly when canvas is unavailable or fails", () => {
    const recording = recordingContext();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => recording.context),
      toDataURL: vi.fn(() => "data:image/png;base64,cover"),
    } as unknown as HTMLCanvasElement;
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    expect(renderCoverArt(design("cross", "plain"), 96)).toBe("data:image/png;base64,cover");
    expect(canvas.width).toBe(96);
    expect(canvas.height).toBe(96);

    vi.mocked(canvas.getContext).mockReturnValue(null);
    expect(renderCoverArt(design("cross", "plain"))).toBeNull();

    vi.mocked(canvas.getContext).mockReturnValue(recordingContext({ throwOnFill: true }).context);
    expect(renderCoverArt(design("cross", "plain"))).toBeNull();
  });
});
