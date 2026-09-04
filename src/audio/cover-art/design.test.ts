import { describe, expect, test } from "vitest";
import { MUSIC_ROOTS, getMusicRoot } from "../composition/roots";
import { coverArtDesign, type CoverArtSubject } from "./design";

const COLORS = { background: "oklch(0.95 0.01 255)", foreground: "oklch(0.46 0.09 255)" };

function snapshot(overrides: Partial<CoverArtSubject> = {}): CoverArtSubject {
  return {
    rootId: "hearth",
    compositionSeed: 4242,
    variationSeed: 7,
    form: "strophic",
    tonicMidi: 48,
    ...overrides,
  };
}

describe("cover art design", () => {
  test("the same take always draws the same cover", () => {
    expect(coverArtDesign(snapshot(), COLORS)).toEqual(coverArtDesign(snapshot(), COLORS));
  });

  // A cover is drawn from the composition and its variation only, which is why
  // the performance seed is not part of a subject: rerolling the performance
  // changes the timing of a take, not what the take is.
  test("a variation draws a new cover", () => {
    expect(coverArtDesign(snapshot({ variationSeed: 400 }), COLORS).key).not.toBe(
      coverArtDesign(snapshot(), COLORS).key,
    );
  });

  test("the metre divides the rose, and never past eight", () => {
    for (const root of MUSIC_ROOTS) {
      const design = coverArtDesign(snapshot({ rootId: root.id }), COLORS);
      expect(design.symmetry).toBe({ "2/4": 4, "3/4": 6, "6/8": 8 }[getMusicRoot(root.id).meter]);
      expect(design.symmetry).toBeLessThanOrEqual(8);
    }
  });

  test("every form has its own device", () => {
    const forms = ["strophic", "paired-puncta", "refrain-verse", "ballata", "ostinato", "through-composed"] as const;
    const devices = forms.map((form) => coverArtDesign(snapshot({ form }), COLORS).device);

    expect(new Set(devices).size).toBe(forms.length);
  });

  test("the tonic turns the window once around the twelve pitch classes", () => {
    const rotations = Array.from(
      { length: 12 },
      (_, semitone) => coverArtDesign(snapshot({ tonicMidi: 48 + semitone }), COLORS).rotationDegrees,
    );

    expect(new Set(rotations).size).toBe(12);
    expect(rotations.every((degrees) => degrees >= 0 && degrees < 360)).toBe(true);
    expect(coverArtDesign(snapshot({ tonicMidi: 60 }), COLORS).rotationDegrees).toBe(
      coverArtDesign(snapshot({ tonicMidi: 48 }), COLORS).rotationDegrees,
    );
  });

  test("every root produces a band treatment, and the roster uses all three", () => {
    const bands = MUSIC_ROOTS.map((root) => coverArtDesign(snapshot({ rootId: root.id }), COLORS).band);

    expect(new Set(bands)).toEqual(new Set(["plain", "spoked", "studded"]));
  });

  test("the theme colours the cover and changes its identity", () => {
    const design = coverArtDesign(snapshot(), COLORS);

    expect(design.field).toBe(COLORS.background);
    expect(design.ink).toBe(COLORS.foreground);
    expect(
      coverArtDesign(snapshot(), {
        background: "oklch(0.19 0.02 30)",
        foreground: "oklch(0.66 0.09 30)",
      }).key,
    ).not.toBe(design.key);
  });
});
