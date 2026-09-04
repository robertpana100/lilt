import { createMusicRandom, mixMusicSeed } from "./random";
import { clamp } from "./pitch";
import type { MusicPart } from "./roots";
import type { MusicPiece, PerformanceVariation } from "./types";

const STRING_PERFORMANCE_SALT = 0x53545247;
const RHYTHM_PERFORMANCE_SALT = 0x52485954;

/** A composed piece never changes, so its per-part indices are built once. */
const partEventIndices = new WeakMap<MusicPiece, readonly number[]>();

function indicesByEvent(piece: MusicPiece): readonly number[] {
  const cached = partEventIndices.get(piece);
  if (cached) return cached;
  const counters: Record<MusicPart, number> = { strings: 0, rhythm: 0 };
  const indices = piece.events.map((event) => counters[event.part]++);
  partEventIndices.set(piece, indices);
  return indices;
}

/** Stable index inside one voice, unaffected by events added to the other. */
export function musicPartEventIndex(piece: MusicPiece, eventIndex: number): number {
  return indicesByEvent(piece)[eventIndex] ?? Math.max(0, eventIndex);
}

export function getPerformanceVariation(
  piece: MusicPiece,
  eventIndex: number,
  humanization: number,
): PerformanceVariation {
  const amount = clamp(humanization);
  const event = piece.events[eventIndex];
  const partSalt = event?.part === "rhythm" ? RHYTHM_PERFORMANCE_SALT : STRING_PERFORMANCE_SALT;
  const random = createMusicRandom(
    mixMusicSeed(piece.performanceSeed, musicPartEventIndex(piece, eventIndex), partSalt, 0x4556454e),
  );
  const maximumJitter = Math.min(0.035, piece.pulseSeconds * 0.4) * amount;
  const rawOffset = (random() * 2 - 1) * maximumJitter;
  return {
    startOffsetSeconds: piece.events[eventIndex]?.startPulse === 0 ? Math.max(0, rawOffset) : rawOffset,
    durationScale: 1 + (random() * 2 - 1) * 0.08 * amount,
    velocityScale: 1 + (random() * 2 - 1) * 0.12 * amount,
  };
}
