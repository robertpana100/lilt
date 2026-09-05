import { describe, expect, test } from "vitest";
import {
  generateMusicPiece,
  type MusicCourseEvent,
  type MusicGeneratorConfig,
  type MusicPiece,
} from "@/audio/composition/generator";
import { luteSoundingDuration, renderMusicEvent } from "@/audio/synthesis/event-renderer";
import { DEFAULT_MUSIC_EFFECTS } from "@/audio/synthesis/effects/config";
import type { MusicSynth } from "@/audio/synthesis/synth";
import { DEFAULT_MUSIC_CHORDS } from "@/audio/composition/chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "@/audio/composition/rhythm-lute-config";

const config: MusicGeneratorConfig = {
  rootId: "road",
  bpm: 80,
  masterSeed: 42,
  pieceIndex: 0,
  variationIndex: 0,
  performanceIndex: 0,
  novelty: 0.5,
  chords: DEFAULT_MUSIC_CHORDS,
  rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
  humanization: 0,
  formOverride: null,
  tonicOverride: null,
  autoAdvance: true,
};

function note(startPulse: number, durationPulses: number): MusicCourseEvent {
  return {
    kind: "course",
    part: "strings",
    startPulse,
    durationPulses,
    pitches: [60],
    velocity: 0.6,
    articulation: "normal",
  };
}

describe("lute event rendering", () => {
  test("uses a silent interval for decay and lets the tail ring beneath the next onset", () => {
    const generated = generateMusicPiece(config);
    const first = note(0, 12);
    const piece = { ...generated, events: [first, note(48, 12)] };
    const timing = { eventTime: 10, minTime: 0 };

    const duration = luteSoundingDuration(piece, first, 0, 0, timing);
    expect(duration).toBeGreaterThan(12 * piece.pulseSeconds);
    expect(duration).toBeGreaterThan(48 * piece.pulseSeconds);
  });

  test("lets the final course decay naturally beyond its written gate", () => {
    const generated = generateMusicPiece(config);
    const final = note(0, 24);
    const piece = { ...generated, events: [final] };

    expect(luteSoundingDuration(piece, final, 0, 0, { eventTime: 0, minTime: 0 })).toBe(4.2);
  });

  test("drops a late event when it has no non-overlapping window left", () => {
    const generated = generateMusicPiece(config);
    const first = note(0, 12);
    const piece = { ...generated, events: [first, note(24, 12)] };

    expect(luteSoundingDuration(piece, first, 0, 0, { eventTime: 10, minTime: 20 })).toBe(0);
  });

  test("schedules the lute at an audible mix level", () => {
    const piece = generateMusicPiece(config);
    const firstCourse = piece.events.find(
      (event): event is MusicCourseEvent => event.kind === "course" && event.part === "strings",
    )!;
    const levels: number[] = [];
    const synth = {
      playLute: (
        _style: unknown,
        _technique: unknown,
        _note: unknown,
        _time: unknown,
        _duration: unknown,
        level: number,
      ) => levels.push(level),
    } as unknown as MusicSynth;

    renderMusicEvent(
      synth,
      piece,
      firstCourse,
      piece.events.indexOf(firstCourse),
      {
        humanization: 0,
        chords: DEFAULT_MUSIC_CHORDS,
        rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
        mutedParts: { strings: false, rhythm: false },
        effects: DEFAULT_MUSIC_EFFECTS,
      },
      null,
      { eventTime: 0, minTime: 0 },
    );

    expect(levels[0]).toBeGreaterThan(0.08);
  });

  test("strums every chord course from low to high without adding a score event", () => {
    const generated = generateMusicPiece(config);
    const chord = { ...note(0, 24), pitches: [60, 48, 55] as const };
    const piece = { ...generated, events: [chord] };
    const played: Array<{ note: number; time: number; level: number; pan: number }> = [];
    const synth = {
      playLute: (
        _style: unknown,
        _technique: unknown,
        playedNote: number,
        time: number,
        _duration: number,
        level: number,
        pan: number,
      ) => played.push({ note: playedNote, time, level, pan }),
    } as unknown as MusicSynth;

    renderMusicEvent(
      synth,
      piece,
      chord,
      0,
      {
        humanization: 0,
        chords: DEFAULT_MUSIC_CHORDS,
        rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
        mutedParts: { strings: false, rhythm: false },
        effects: DEFAULT_MUSIC_EFFECTS,
      },
      null,
      { eventTime: 2, minTime: 0 },
    );

    expect(played.map(({ note: playedNote }) => playedNote)).toEqual([48, 55, 60]);
    expect(played.map(({ time }) => time)).toEqual([2, 2.011, 2.022]);
    expect(played.every(({ level }) => level > 0.05)).toBe(true);
    expect(played[0]!.pan).toBeLessThan(played[2]!.pan);
  });

  test("uses the configured chord strum spread", () => {
    const generated = generateMusicPiece(config);
    const chord = { ...note(0, 24), pitches: [60, 48, 55] as const };
    const piece = { ...generated, events: [chord] };
    const times: number[] = [];
    const synth = {
      playLute: (_style: unknown, _technique: unknown, _note: unknown, time: number) => times.push(time),
    } as unknown as MusicSynth;

    renderMusicEvent(
      synth,
      piece,
      chord,
      0,
      {
        humanization: 0,
        chords: { ...DEFAULT_MUSIC_CHORDS, strumMs: 25 },
        rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
        mutedParts: { strings: false, rhythm: false },
        effects: DEFAULT_MUSIC_EFFECTS,
      },
      null,
      { eventTime: 1, minTime: 0 },
    );

    expect(times).toEqual([1, 1.025, 1.05]);
  });

  test("does not let the rhythm lute shorten a ringing lead course", () => {
    const generated = generateMusicPiece(config);
    const first = note(0, 12);
    const rhythm: MusicCourseEvent = {
      kind: "course",
      part: "rhythm",
      startPulse: 24,
      durationPulses: 24,
      pitches: [48, 55, 60],
      velocity: 0.5,
      articulation: "accent",
    };
    const piece = { ...generated, events: [first, rhythm, note(48, 12)] };

    const duration = luteSoundingDuration(piece, first, 0, 0, { eventTime: 0, minTime: 0 });
    expect(duration).toBeGreaterThan(24 * piece.pulseSeconds);
    expect(duration).toBeGreaterThan(48 * piece.pulseSeconds);
  });

  test("renders rhythm chords as the darker, left-positioned second lute", () => {
    const generated = generateMusicPiece(config);
    const rhythm: MusicCourseEvent = {
      kind: "course",
      part: "rhythm",
      startPulse: 0,
      durationPulses: 48,
      pitches: [48, 52, 55],
      velocity: 0.55,
      articulation: "accent",
    };
    const piece = { ...generated, events: [rhythm] };
    const played: Array<{ technique: string; pan: number; level: number }> = [];
    const synth = {
      playLute: (
        _style: unknown,
        technique: string,
        _note: unknown,
        _time: unknown,
        _duration: unknown,
        level: number,
        pan: number,
      ) => played.push({ technique, pan, level }),
    } as unknown as MusicSynth;

    renderMusicEvent(
      synth,
      piece,
      rhythm,
      0,
      {
        humanization: 0,
        chords: DEFAULT_MUSIC_CHORDS,
        rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
        mutedParts: { strings: false, rhythm: false },
        effects: DEFAULT_MUSIC_EFFECTS,
      },
      null,
      { eventTime: 0, minTime: 0 },
    );

    expect(played).toHaveLength(3);
    expect(played.every(({ technique }) => technique === "rhythm")).toBe(true);
    expect(played.every(({ pan }) => pan < 0)).toBe(true);
    expect(played.every(({ level }) => level > 0.02)).toBe(true);
  });

  test("renders drone roots with the sustained drone technique", () => {
    const generated = generateMusicPiece(config);
    const dronePiece: MusicPiece = { ...generated, rootId: "hearth" };
    const drone: MusicCourseEvent = {
      kind: "course",
      part: "rhythm",
      startPulse: 0,
      durationPulses: 72,
      pitches: [48, 55],
      velocity: 0.5,
      articulation: "accent",
    };
    const played: Array<{ technique: string; pan: number }> = [];
    const synth = {
      playLute: (
        _style: unknown,
        technique: string,
        _note: unknown,
        _time: unknown,
        _duration: unknown,
        _level: unknown,
        pan: number,
      ) => played.push({ technique, pan }),
    } as unknown as MusicSynth;

    renderMusicEvent(
      synth,
      { ...dronePiece, events: [drone] },
      drone,
      0,
      {
        humanization: 0,
        chords: DEFAULT_MUSIC_CHORDS,
        rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
        mutedParts: { strings: false, rhythm: false },
        effects: DEFAULT_MUSIC_EFFECTS,
      },
      null,
      { eventTime: 0, minTime: 0 },
    );

    expect(played).toHaveLength(2);
    expect(played.every(({ technique }) => technique === "drone")).toBe(true);
    expect(played.every(({ pan }) => pan < 0)).toBe(true);
  });
});
