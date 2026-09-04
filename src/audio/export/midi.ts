import type { MusicPiece } from "../composition/types";
import { PULSES_PER_QUARTER } from "../composition/roots";

const TICKS_PER_QUARTER = 96;
const TICKS_PER_PULSE = TICKS_PER_QUARTER / PULSES_PER_QUARTER;
const LUTE_CHANNEL = 0;
const RHYTHM_LUTE_CHANNEL = 1;
/** General MIDI's closest portable stand-in for the procedural lute. */
const LUTE_PROGRAM = 24;

function ascii(value: string): number[] {
  return Array.from(new TextEncoder().encode(value));
}

function uint32(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function uint16(value: number): number[] {
  return [(value >>> 8) & 0xff, value & 0xff];
}

function variableLength(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>>= 8;
    else break;
  }
  return bytes;
}

interface MidiEvent {
  tick: number;
  order: number;
  data: number[];
}

function metaEvent(type: number, data: number[]): number[] {
  return [0xff, type, ...variableLength(data.length), ...data];
}

/** Encodes the generated score as a portable format-0 Standard MIDI File. */
export function createMusicMidi(piece: MusicPiece, title: string): Uint8Array {
  const events: MidiEvent[] = [];
  const microsecondsPerQuarter = Math.round(60_000_000 / piece.bpm);
  const [numeratorText, denominatorText] = piece.meter.split("/") as [string, string];
  const numerator = Number(numeratorText);
  const denominator = Number(denominatorText);
  events.push({ tick: 0, order: -4, data: metaEvent(0x03, ascii(title)) });
  events.push({
    tick: 0,
    order: -3,
    data: metaEvent(0x51, [
      (microsecondsPerQuarter >>> 16) & 0xff,
      (microsecondsPerQuarter >>> 8) & 0xff,
      microsecondsPerQuarter & 0xff,
    ]),
  });
  events.push({
    tick: 0,
    order: -2,
    data: metaEvent(0x58, [numerator, Math.log2(denominator), 24, 8]),
  });
  events.push({ tick: 0, order: -1, data: [0xc0 | LUTE_CHANNEL, LUTE_PROGRAM] });
  events.push({ tick: 0, order: -1, data: [0xc0 | RHYTHM_LUTE_CHANNEL, LUTE_PROGRAM] });
  piece.events.forEach((event) => {
    const startTick = Math.round(event.startPulse * TICKS_PER_PULSE);
    const endTick = Math.round((event.startPulse + event.durationPulses) * TICKS_PER_PULSE);
    const velocity = Math.max(1, Math.min(127, Math.round(event.velocity * 112)));
    const channel = event.part === "rhythm" ? RHYTHM_LUTE_CHANNEL : LUTE_CHANNEL;
    event.pitches.forEach((pitch) => {
      events.push({
        tick: startTick,
        order: 1,
        data: [0x90 | channel, pitch, velocity],
      });
      events.push({
        tick: endTick,
        order: 0,
        data: [0x80 | channel, pitch, 0],
      });
    });
  });
  events.sort((left, right) => left.tick - right.tick || left.order - right.order);
  const track: number[] = [];
  let previousTick = 0;
  events.forEach((event) => {
    track.push(...variableLength(event.tick - previousTick), ...event.data);
    previousTick = event.tick;
  });
  track.push(0, ...metaEvent(0x2f, []));
  return new Uint8Array([
    ...ascii("MThd"),
    ...uint32(6),
    ...uint16(0),
    ...uint16(1),
    ...uint16(TICKS_PER_QUARTER),
    ...ascii("MTrk"),
    ...uint32(track.length),
    ...track,
  ]);
}
