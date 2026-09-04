import { describe, expect, test } from "vitest";
import { generateMusicPiece, type MusicGeneratorConfig } from "./composition/generator";
import { createMusicMidi, musicFilename } from "./musicExport";
import { DEFAULT_MUSIC_CHORDS } from "./composition/chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "./composition/rhythm-lute-config";

const config: MusicGeneratorConfig = {
  rootId: "road",
  bpm: 108,
  masterSeed: 42,
  pieceIndex: 0,
  variationIndex: 0,
  performanceIndex: 0,
  novelty: 0.5,
  chords: DEFAULT_MUSIC_CHORDS,
  rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
  humanization: 0.55,
  formOverride: null,
  tonicOverride: null,
  autoAdvance: true,
};

describe("music export formats", () => {
  test("writes a complete format-0 MIDI file", () => {
    const bytes = createMusicMidi(generateMusicPiece(config), "Wandering Wayside Reel");
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("MThd");
    expect(new TextDecoder().decode(bytes.slice(14, 18))).toBe("MTrk");
    expect(Array.from(bytes.slice(-3))).toEqual([0xff, 0x2f, 0]);
    expect(bytes.length).toBeGreaterThan(100);
  });

  test("exports the rhythm lute on its own melodic channel", () => {
    const piece = generateMusicPiece(config);
    expect(piece.events.some((event) => event.part === "rhythm")).toBe(true);
    const bytes = createMusicMidi(piece, "Two lutes");
    expect(bytes.some((byte) => byte === 0x91)).toBe(true);
  });

  test("maps the 24-pulse grid exactly onto 96-PPQ MIDI ticks", () => {
    const piece = generateMusicPiece({ ...config, rootId: "guildhall", bpm: 96, masterSeed: 19 });
    expect(piece.events.some((event) => event.durationPulses === 8)).toBe(true);
    const bytes = createMusicMidi(piece, "Guildhall pulse test");
    const noteDurations: number[] = [];
    const active = new Map<string, number[]>();
    let offset = 22;
    let tick = 0;
    const readVariableLength = () => {
      let value = 0;
      while (true) {
        const byte = bytes[offset++]!;
        value = (value << 7) | (byte & 0x7f);
        if ((byte & 0x80) === 0) return value;
      }
    };
    while (offset < bytes.length) {
      tick += readVariableLength();
      const status = bytes[offset++]!;
      if (status === 0xff) {
        offset += 1;
        offset += readVariableLength();
        continue;
      }
      if ((status & 0xf0) === 0xc0) {
        offset += 1;
        continue;
      }
      const pitch = bytes[offset++]!;
      const velocity = bytes[offset++]!;
      const key = `${status & 0x0f}:${pitch}`;
      if ((status & 0xf0) === 0x90 && velocity > 0) {
        const starts = active.get(key) ?? [];
        starts.push(tick);
        active.set(key, starts);
      } else if ((status & 0xf0) === 0x80 || ((status & 0xf0) === 0x90 && velocity === 0)) {
        const starts = active.get(key);
        const start = starts?.shift();
        if (start !== undefined) noteDurations.push(tick - start);
      }
    }
    expect(noteDurations).toContain(32);
  });

  test("creates safe, recognizable filenames", () => {
    expect(musicFilename("The Ember's Air")).toBe("the-ember-s-air.mid");
  });
});
