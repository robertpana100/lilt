import { describe, expect, test } from "vitest";
import { auditionChordPitches } from "./audition";

describe("chord audition voicings", () => {
  test("previews exact single, fifth, and open-fifth pitches", () => {
    expect(auditionChordPitches(48, "dorian", "single")).toEqual([48]);
    expect(auditionChordPitches(48, "dorian", "fifth-dyad")).toEqual([48, 55]);
    expect(auditionChordPitches(48, "dorian", "open-fifth")).toEqual([48, 55, 60]);
  });

  test("takes the triad third from the selected modal root", () => {
    expect(auditionChordPitches(48, "dorian", "modal-triad")).toEqual([48, 51, 55]);
    expect(auditionChordPitches(48, "mixolydian", "modal-triad")).toEqual([48, 52, 55]);
  });
});
