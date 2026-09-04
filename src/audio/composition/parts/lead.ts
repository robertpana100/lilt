import { PULSES_PER_QUARTER, type MusicCadencePattern, type MusicRoot } from "../roots";
import { CADENCE_SLOT_PULSES, transformPhraseBody } from "../phrase";
import { cadencePitches, fitToRangeNear, modalBridgePitches, scaleNote } from "../pitch";
import { addEvent } from "./events";
import type { MusicEvent, MusicPhrase, MusicSection } from "../types";

/**
 * Writes the one lute melody every section carries onto the event list. Chord
 * voicing is applied later, after the complete line has been bounded against
 * adjacent events.
 */
export function renderLead(
  root: MusicRoot,
  section: MusicSection,
  phrase: MusicPhrase,
  cadence: MusicCadencePattern,
  tonicMidi: number,
  novelty: number,
  totalPulses: number,
  events: MusicEvent[],
): void {
  const leadPart = "strings" as const;
  // A solo verse speaks more intimately than the full-company refrain; the
  // caesura bar belongs to the second lute, so the melody stops at the span.
  const leadVelocity = section.role === "verse" ? 0.55 : section.role === "refrain" ? 0.6 : 0.58;
  const spanPulses = section.lengthPulses - section.bridgePulses;
  const body = transformPhraseBody(phrase.body, section.transform, novelty);
  const cadenceDuration = cadence.durations.reduce((sum, duration) => sum + duration, 0);
  const writtenCadencePitches = cadencePitches(root, tonicMidi, cadence);
  const firstCadencePitch = writtenCadencePitches[0];
  if (firstCadencePitch === undefined || cadence.degrees.length !== cadence.durations.length) {
    throw new Error("A cadence requires matching, non-empty degree and duration lists.");
  }
  let cadenceCursor = spanPulses - cadenceDuration;
  let previousPitch: number | null = null;

  body.forEach((note) => {
    if (note.offsetPulse + note.durationPulses > spanPulses - CADENCE_SLOT_PULSES) return;
    const degree = Math.min(root.style.degreeRange[1], Math.max(root.style.degreeRange[0], note.degree));
    const pitch = fitToRangeNear(scaleNote(root.mode, tonicMidi, degree, 1), root.style.melodyRange, previousPitch);
    previousPitch = pitch;
    addEvent(
      events,
      {
        kind: "course",
        part: leadPart,
        startPulse: section.startPulse + note.offsetPulse,
        durationPulses: note.durationPulses,
        pitches: [pitch],
        velocity: leadVelocity,
        articulation: note.durationPulses >= PULSES_PER_QUARTER ? "legato" : "normal",
      },
      totalPulses,
    );
  });

  const cadenceLeadPulses = CADENCE_SLOT_PULSES - cadenceDuration;
  if (previousPitch !== null && cadenceLeadPulses >= 6) {
    const bridgePitches = modalBridgePitches(
      root,
      tonicMidi,
      previousPitch,
      firstCadencePitch,
      Math.floor(cadenceLeadPulses / 6),
    );
    const bridgeDuration = bridgePitches.length > 0 ? Math.floor(cadenceLeadPulses / bridgePitches.length) : 0;
    let bridgeCursor = spanPulses - CADENCE_SLOT_PULSES;
    bridgePitches.forEach((pitch, index) => {
      const durationPulses =
        index === bridgePitches.length - 1 ? cadenceLeadPulses - bridgeDuration * index : bridgeDuration;
      addEvent(
        events,
        {
          kind: "course",
          part: leadPart,
          startPulse: section.startPulse + bridgeCursor,
          durationPulses,
          pitches: [pitch],
          velocity: leadVelocity - 0.01,
          articulation: "legato",
        },
        totalPulses,
      );
      bridgeCursor += durationPulses;
    });
  }

  cadence.durations.forEach((durationPulses, index) => {
    const pitch = writtenCadencePitches[index];
    if (durationPulses === undefined || pitch === undefined) {
      throw new Error("A cadence requires a pitch and duration for every degree.");
    }
    addEvent(
      events,
      {
        kind: "course",
        part: leadPart,
        startPulse: section.startPulse + cadenceCursor,
        durationPulses,
        pitches: [pitch],
        velocity: index === cadence.degrees.length - 1 ? leadVelocity + 0.2 : leadVelocity + 0.04,
        articulation: index === cadence.degrees.length - 1 ? "accent" : "legato",
      },
      totalPulses,
    );
    cadenceCursor += durationPulses;
  });
}
