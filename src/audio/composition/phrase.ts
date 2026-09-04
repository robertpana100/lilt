import { PULSES_PER_QUARTER, pulsesPerBar, type MusicCadencePattern, type MusicRoot } from "./roots";
import { createMusicRandom, mixMusicSeed, pickMusicValue } from "./random";
import { weightedInterval } from "./pitch";
import type { MusicCadence, MusicPhrase, MusicPhraseNote, PhraseTransform } from "./types";

export const CADENCE_SLOT_PULSES = PULSES_PER_QUARTER * 3;

export function createPhrase(root: MusicRoot, phraseId: string, bars: number, random: () => number): MusicPhrase {
  const totalPulses = bars * pulsesPerBar(root.meter);
  const bodyEnd = Math.max(PULSES_PER_QUARTER, totalPulses - CADENCE_SLOT_PULSES);
  const pickupPulses = Math.min(bodyEnd - 1, pickMusicValue(root.style.pickupPulses, random));
  const body: MusicPhraseNote[] = [];
  let cursor = pickupPulses;
  let degree = pickMusicValue(root.style.startingDegrees, random);
  let previousInterval = 0;
  while (cursor < bodyEnd) {
    const cell = pickMusicValue(root.style.rhythmCells, random);
    for (const sourceDuration of cell) {
      if (cursor >= bodyEnd) break;
      const durationPulses = Math.min(sourceDuration, bodyEnd - cursor);
      if (durationPulses < 3) {
        cursor = bodyEnd;
        break;
      }
      let interval = weightedInterval(root, random);
      const recoveringLeap = Math.abs(previousInterval) > 2;
      if (recoveringLeap) interval = previousInterval > 0 ? -1 : 1;
      const progress = (cursor - pickupPulses) / Math.max(1, bodyEnd - pickupPulses);
      const archCenter = pickMusicValue(root.style.recitingDegrees, random) + Math.sin(progress * Math.PI) * 1.8;
      if (!recoveringLeap && degree < archCenter - 1.5 && interval < 0) {
        interval = Math.abs(interval);
      }
      if (!recoveringLeap && degree > archCenter + 1.5 && interval > 0) {
        interval = -interval;
      }
      // Phrase openings occasionally take the psalmodic rising fifth toward
      // the reciting region; a leap that wide belongs to beginnings, never to
      // mid-phrase motion.
      if (body.length === 0 && interval === 1 && random() < 0.08) interval = 4;
      const previousDegree = degree;
      degree = Math.round(Math.min(root.style.degreeRange[1], Math.max(root.style.degreeRange[0], degree + interval)));
      const shouldRest = body.length > 0 && random() < root.style.restChance;
      if (!shouldRest) {
        body.push({ offsetPulse: cursor, durationPulses, degree });
      } else {
        degree = previousDegree;
      }
      cursor += durationPulses;
      previousInterval = shouldRest ? 0 : degree - previousDegree;
    }
  }
  return { id: phraseId, bars, pickupPulses, body };
}

export function transformPhraseBody(
  body: readonly MusicPhraseNote[],
  transform: PhraseTransform,
  novelty: number,
): MusicPhraseNote[] {
  if (transform === "identity") return body.map((note) => ({ ...note }));
  if (transform === "sequence-up" || transform === "sequence-down") {
    const amount = transform === "sequence-up" ? 1 : -1;
    return body.map((note) => ({ ...note, degree: note.degree + amount }));
  }
  if (transform === "answer") {
    const center = body[0]?.degree ?? 0;
    return body.map((note) => ({
      ...note,
      degree: center - (note.degree - center),
    }));
  }
  if (transform === "rhythmic-variation" && body.length > 2) {
    const result = body.map((note) => ({ ...note }));
    for (let index = 0; index + 1 < result.length; index += 3) {
      const current = result[index];
      const next = result[index + 1];
      if (!current || !next) continue;
      const available = current.durationPulses + next.durationPulses;
      if (available < 12) continue;
      const first = Math.max(3, Math.round((available * (novelty > 0.65 ? 1 : 2)) / 3));
      current.durationPulses = first;
      next.offsetPulse = current.offsetPulse + first;
      next.durationPulses = available - first;
    }
    return result;
  }
  if (transform === "ornament") {
    const result: MusicPhraseNote[] = [];
    body.forEach((note, index) => {
      if (note.durationPulses >= 12 && index % 4 === 2) {
        const first = Math.max(3, Math.floor(note.durationPulses / 2));
        result.push({ ...note, durationPulses: first });
        // The index gate admits only even indices, so every ornament uses the
        // upper neighbor. This direction is part of seeded output.
        result.push({
          offsetPulse: note.offsetPulse + first,
          durationPulses: note.durationPulses - first,
          degree: note.degree + 1,
        });
      } else {
        result.push({ ...note });
      }
    });
    return result;
  }
  return body.map((note) => ({ ...note }));
}

export function cadenceFor(
  root: MusicRoot,
  cadence: MusicCadence,
  seed: number,
  sectionIndex: number,
): MusicCadencePattern {
  const patterns = root.style.cadences[cadence];
  return pickMusicValue(patterns, createMusicRandom(mixMusicSeed(seed, sectionIndex, 0x43414445)));
}
