import { createMusicRandom, mixMusicSeed } from "./random";
import { MODE_INTERVALS, PULSES_PER_QUARTER, pulsesPerBar, type MusicRoot } from "./roots";
import { scaleNote } from "./pitch";
import type { MusicCourseEvent, MusicSection } from "./types";
import type { MusicChordConfig } from "./chord-config";

const CHORD_SALT = 0x43484f52;
const LOWEST_LUTE_COURSE = 40;

export function modalDegreeForPitch(root: MusicRoot, tonicMidi: number, pitch: number): number | null {
  const intervals = MODE_INTERVALS[root.mode];
  for (let octave = -4; octave <= 5; octave += 1) {
    for (const [degree, interval] of intervals.entries()) {
      if (tonicMidi + interval + octave * 12 === pitch) return octave * intervals.length + degree;
    }
  }
  return null;
}

/** Keep the authored melody first while adding lower courses in pitch order. */
function melodyTopVoicing(melody: number, lowerCourses: readonly number[]): readonly [number, ...number[]] {
  const lower = [...new Set(lowerCourses)]
    .filter((pitch) => pitch >= LOWEST_LUTE_COURSE && pitch < melody)
    .sort((left, right) => left - right);
  return [melody, ...lower];
}

function modalChord(root: MusicRoot, tonicMidi: number, melody: number, voices: 2 | 3): readonly [number, ...number[]] {
  const degree = modalDegreeForPitch(root, tonicMidi, melody);
  if (degree === null) return melodyTopVoicing(melody, [melody - 7]);
  const thirdBelow = scaleNote(root.mode, tonicMidi, degree - 2);
  const fifthBelow = scaleNote(root.mode, tonicMidi, degree - 4);
  // One degree in every mode sits a diminished fifth above the scale note a
  // fifth below it (mi contra fa). Substitute the octave rather than sound
  // the tritone inside an otherwise consonant voicing.
  const lowerFifth = melody - fifthBelow === 6 ? melody - 12 : fifthBelow;
  return melodyTopVoicing(melody, voices === 3 ? [lowerFifth, thirdBelow] : [thirdBelow]);
}

function finalOpenFifth(melody: number, voices: 2 | 3): readonly [number, ...number[]] {
  return melodyTopVoicing(melody, voices === 3 ? [melody - 12, melody - 5] : [melody - 12]);
}

function sectionForEvent(sections: readonly MusicSection[], event: MusicCourseEvent): MusicSection | null {
  return (
    sections.find(
      (section) =>
        event.startPulse >= section.startPulse && event.startPulse < section.startPulse + section.lengthPulses,
    ) ?? null
  );
}

/**
 * Adds bounded, deterministic chord voicings to one non-overlapping lute line.
 * Chords belong to the melody event itself; they never create an accompaniment
 * part or a second rhythmic stream.
 */
export function voiceLuteChords(
  root: MusicRoot,
  tonicMidi: number,
  novelty: number,
  config: Readonly<MusicChordConfig>,
  variationSeed: number,
  sections: readonly MusicSection[],
  events: readonly MusicCourseEvent[],
): readonly MusicCourseEvent[] {
  const barPulses = pulsesPerBar(root.meter);
  if (config.amount <= 0) return events;
  return events.map((event, eventIndex) => {
    const section = sectionForEvent(sections, event);
    if (!section) return event;
    const localPulse = event.startPulse - section.startPulse;
    const isSectionFinal = event.startPulse + event.durationPulses === section.startPulse + section.lengthPulses;
    const isStructural =
      event.articulation === "accent" || event.durationPulses >= PULSES_PER_QUARTER || localPulse % barPulses === 0;
    const random = createMusicRandom(mixMusicSeed(variationSeed, eventIndex, CHORD_SALT));
    // A solo verse's line stays transparent; the full company's sections
    // carry the authored chord density.
    const soloFactor = section.role === "verse" ? 0.45 : 1;
    const chordChance = config.amount * (0.2 + novelty * 0.4) * soloFactor;
    if (!isSectionFinal && (!isStructural || random() >= chordChance)) return event;

    const voices: 2 | 3 =
      config.maxCourses === 2
        ? 2
        : isSectionFinal && section.cadence === "closed"
          ? 3
          : event.durationPulses >= PULSES_PER_QUARTER && random() < 0.72
            ? 3
            : 2;
    const melody = event.pitches[0];
    const pitches =
      isSectionFinal && section.cadence === "closed"
        ? finalOpenFifth(melody, voices)
        : modalChord(root, tonicMidi, melody, voices);
    return pitches.length > 1 ? { ...event, pitches } : event;
  });
}
