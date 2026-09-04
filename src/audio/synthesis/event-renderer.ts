import { mixMusicSeed } from "../composition/random";
import { musicPartEventIndex } from "../composition/performance";
import {
  getPerformanceVariation,
  type MusicCourseEvent,
  type MusicEvent,
  type MusicPiece,
} from "../composition/generator";
import { getMusicRoot } from "../composition/roots";
import { MAX_MUSIC_LUTE_COURSE_SECONDS, type MusicRenderOptions, type MusicSynth } from "./synth";
import { playLuteVoicing } from "./lute-performance";

const ACCENT_VELOCITY_SCALE = 1.08;
const LUTE_COURSE_SALT = 0x4c555445;
const RHYTHM_LUTE_SALT = 0x52485954;
const LUTE_LEVEL = 0.16;
const RHYTHM_LUTE_LEVEL = 0.15;
const COURSE_RING_OVERLAP_SECONDS = 1.2;
const AVAILABLE_INTERVAL_USE = 0.99;
const FINAL_COURSE_RING_SECONDS = 4.2;

export interface MusicEventTiming {
  /** Absolute context time at which the event's start pulse falls. */
  eventTime: number;
  /** Earliest time the context can honor; late events clamp to it. */
  minTime: number;
}

/**
 * Lets a plucked course decay naturally through rests and underneath the next
 * attack from the same lute. Written duration remains the minimum musical
 * intention; the overlap is resonance, not another score event.
 */
export function luteSoundingDuration(
  piece: MusicPiece,
  event: MusicCourseEvent,
  eventIndex: number,
  humanization: number,
  timing: MusicEventTiming,
): number {
  const performance = getPerformanceVariation(piece, eventIndex, humanization);
  const start = Math.max(timing.minTime, timing.eventTime + performance.startOffsetSeconds);
  const writtenDuration = event.durationPulses * piece.pulseSeconds * performance.durationScale;
  let nextIndex = eventIndex + 1;
  while (nextIndex < piece.events.length && piece.events[nextIndex]?.part !== event.part) {
    nextIndex += 1;
  }
  const next = piece.events[nextIndex];
  if (!next || next.part !== event.part) {
    return Math.min(
      MAX_MUSIC_LUTE_COURSE_SECONDS,
      Math.max(writtenDuration + COURSE_RING_OVERLAP_SECONDS, FINAL_COURSE_RING_SECONDS),
    );
  }

  const nextPerformance = getPerformanceVariation(piece, nextIndex, humanization);
  const nextEventTime = timing.eventTime + (next.startPulse - event.startPulse) * piece.pulseSeconds;
  const nextStart = Math.max(timing.minTime, nextEventTime + nextPerformance.startOffsetSeconds);
  const available = nextStart - start;
  if (available <= 0) return 0;
  const extended = Math.max(
    writtenDuration + COURSE_RING_OVERLAP_SECONDS,
    available * AVAILABLE_INTERVAL_USE + COURSE_RING_OVERLAP_SECONDS,
  );
  return Math.min(MAX_MUSIC_LUTE_COURSE_SECONDS, extended);
}

/** Applies the score's gain, pan, accent, and strum behavior during playback. */
export function renderMusicEvent(
  synth: MusicSynth,
  piece: MusicPiece,
  event: MusicEvent,
  eventIndex: number,
  options: MusicRenderOptions,
  bus: AudioNode | null,
  timing: MusicEventTiming,
): void {
  if (options.mutedParts[event.part]) return;
  const performance = getPerformanceVariation(piece, eventIndex, options.humanization);
  const partEventIndex = musicPartEventIndex(piece, eventIndex);
  const start = Math.max(timing.minTime, timing.eventTime + performance.startOffsetSeconds);
  const root = getMusicRoot(piece.rootId);
  const duration = luteSoundingDuration(piece, event, eventIndex, options.humanization, timing);
  if (duration <= 0) return;
  const velocity =
    event.velocity * performance.velocityScale * (event.articulation === "accent" ? ACCENT_VELOCITY_SCALE : 1);
  const rhythm = event.part === "rhythm";
  const seed = mixMusicSeed(piece.performanceSeed, partEventIndex, rhythm ? RHYTHM_LUTE_SALT : LUTE_COURSE_SALT);
  playLuteVoicing(
    synth,
    root.luteStyle,
    event.pitches,
    start,
    duration,
    (rhythm ? RHYTHM_LUTE_LEVEL * options.rhythmLute.level : LUTE_LEVEL) * velocity,
    rhythm ? options.rhythmLute.strumMs : options.chords.strumMs,
    seed,
    bus,
    rhythm
      ? {
          technique: root.rhythmLuteTechnique === "drone" ? "drone" : "rhythm",
          panCenter: -0.16,
          panWidth: 0.1,
        }
      : { technique: "melody", panCenter: 0.12, panWidth: 0.08 },
  );
}
