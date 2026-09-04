import { describe, expect, test } from "vitest";
import { generateMusicPiece } from "../composition/generator";
import { getMusicRoot } from "../composition/roots";
import { indexMusicEvents, MusicTransport } from "./transport";
import { DEFAULT_MUSIC_CHORDS } from "../composition/chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "../composition/rhythm-lute-config";

function hearthPiece() {
  const root = getMusicRoot("hearth");
  return generateMusicPiece({
    rootId: "hearth",
    bpm: root.tempo.default,
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
  });
}

describe("indexMusicEvents", () => {
  test("groups every event under its own start pulse", () => {
    const piece = hearthPiece();
    const indexed = indexMusicEvents(piece);

    expect([...indexed.values()].flat()).toHaveLength(piece.events.length);
    indexed.forEach((entries, pulse) => {
      entries.forEach(({ event, index }) => {
        expect(event.startPulse).toBe(pulse);
        expect(piece.events[index]).toBe(event);
      });
    });
  });
});

describe("MusicTransport", () => {
  test("seekTo jumps to a pulse at a known time and leaves any gap", () => {
    const transport = new MusicTransport();
    transport.advance(10);
    transport.advance(10);
    transport.beginGap(4);
    expect(transport.waitingForNextPiece).toBe(true);

    transport.seekTo(200, 12.5);
    expect(transport.pulse).toBe(200);
    expect(transport.nextPulseTime).toBe(12.5);
    expect(transport.waitingForNextPiece).toBe(false);
  });

  test("starts at the first pulse with no gap running", () => {
    const transport = new MusicTransport();

    expect(transport.pulse).toBe(0);
    expect(transport.nextPulseTime).toBe(0);
    expect(transport.waitingForNextPiece).toBe(false);
  });

  test("advancing moves both the pulse and the audio time", () => {
    const transport = new MusicTransport();
    transport.startAt(4);
    transport.advance(0.25);
    transport.advance(0.25);

    expect(transport.pulse).toBe(2);
    expect(transport.nextPulseTime).toBeCloseTo(4.5, 8);
  });

  test("a gap holds the clock forward without consuming a pulse", () => {
    const transport = new MusicTransport();
    transport.startAt(100);
    transport.advance(0.5);
    transport.beginGap(6);

    expect(transport.waitingForNextPiece).toBe(true);
    expect(transport.nextPulseTime).toBeCloseTo(106.5, 8);
    expect(transport.pulse).toBe(1);
  });

  test("rewinding returns to the first pulse and ends the gap, keeping the clock", () => {
    const transport = new MusicTransport();
    transport.startAt(10);
    transport.advance(1);
    transport.beginGap(5);
    transport.rewind();

    expect(transport.pulse).toBe(0);
    expect(transport.waitingForNextPiece).toBe(false);
    expect(transport.nextPulseTime).toBeCloseTo(16, 8);
  });

  test("a pulse is due only inside the lookahead window", () => {
    const transport = new MusicTransport();
    transport.startAt(5);

    expect(transport.isDue(3.5, 1.8)).toBe(true);
    expect(transport.isDue(3.2, 1.8)).toBe(false);
    expect(transport.isDue(5, 0)).toBe(false);
  });

  test("reports the written end only once every pulse has been scheduled", () => {
    const transport = new MusicTransport();

    expect(transport.hasReachedEnd(2)).toBe(false);
    transport.advance(0.1);
    expect(transport.hasReachedEnd(2)).toBe(false);
    transport.advance(0.1);
    expect(transport.hasReachedEnd(2)).toBe(true);
  });
});
