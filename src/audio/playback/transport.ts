import type { MusicEvent, MusicPiece } from "../composition/generator";

export type IndexedMusicEvents = Map<number, Array<{ event: MusicEvent; index: number }>>;

export function indexMusicEvents(piece: MusicPiece): IndexedMusicEvents {
  const eventsByPulse: IndexedMusicEvents = new Map();
  piece.events.forEach((event, index) => {
    const entries = eventsByPulse.get(event.startPulse) ?? [];
    entries.push({ event, index });
    eventsByPulse.set(event.startPulse, entries);
  });
  return eventsByPulse;
}

/**
 * The score clock: which pulse comes next, and when that pulse falls on the
 * audio timeline. It knows nothing about what a pulse contains or about which
 * piece is playing, so it can be positioned directly in tests.
 */
export class MusicTransport {
  private currentPulse = 0;
  private pulseTime = 0;
  private inGap = false;

  get pulse(): number {
    return this.currentPulse;
  }

  /** Audio-context time at which the next unscheduled pulse falls. */
  get nextPulseTime(): number {
    return this.pulseTime;
  }

  /** True while a piece's written end has passed and its gap is running. */
  get waitingForNextPiece(): boolean {
    return this.inGap;
  }

  /** Place the next pulse at a known audio time, as a piece is activated. */
  startAt(time: number): void {
    this.pulseTime = time;
  }

  /** Jump to an arbitrary pulse at a known audio time, leaving any gap. */
  seekTo(pulse: number, time: number): void {
    this.currentPulse = pulse;
    this.pulseTime = time;
    this.inGap = false;
  }

  /** Return to the first pulse of a piece without moving the clock. */
  rewind(): void {
    this.currentPulse = 0;
    this.inGap = false;
  }

  advance(pulseSeconds: number): void {
    this.currentPulse += 1;
    this.pulseTime += pulseSeconds;
  }

  /** The written piece is over; hold the clock across its authored silence. */
  beginGap(gapSeconds: number): void {
    this.inGap = true;
    this.pulseTime += gapSeconds;
  }

  hasReachedEnd(totalPulses: number): boolean {
    return this.currentPulse >= totalPulses;
  }

  /** Whether the next pulse falls inside the scheduler's lookahead window. */
  isDue(currentTime: number, lookaheadSeconds: number): boolean {
    return this.pulseTime < currentTime + lookaheadSeconds;
  }
}
