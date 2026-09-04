import { clamp } from "../pitch";
import type { MusicEvent } from "../types";

/** Admits an event onto the timeline, clamped to the piece and sane bounds. */
export function addEvent(events: MusicEvent[], event: MusicEvent, totalPulses: number): void {
  if (event.startPulse < 0 || event.startPulse >= totalPulses || event.durationPulses <= 0) return;
  events.push({
    ...event,
    durationPulses: Math.min(event.durationPulses, totalPulses - event.startPulse),
    velocity: clamp(event.velocity, 0.05, 1),
  });
}
