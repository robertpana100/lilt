import type { MusicRhythmLuteConfig } from "./rhythm-lute-config";
import { fitToRangeNear, scaleNote } from "./pitch";
import { createMusicRandom, mixMusicSeed, pickMusicValue } from "./random";
import { MODE_INTERVALS, pulsesPerBar, type MusicMode, type MusicRoot } from "./roots";
import { modalDegreeForPitch } from "./chords";
import type { MusicCourseEvent, MusicSection } from "./types";

const RHYTHM_PATTERN_SALT = 0x52595054;
const RHYTHM_LOWEST = 43;
const RHYTHM_HIGHEST = 67;

/** The scale degree whose fifth above is diminished — one exists per mode. */
function tritoneRootDegree(mode: MusicMode): number {
  const intervals = MODE_INTERVALS[mode];
  for (let degree = 0; degree < intervals.length; degree += 1) {
    const upper = degree + 4;
    const semitones = intervals[upper % intervals.length]! + (upper >= intervals.length ? 12 : 0) - intervals[degree]!;
    if (semitones === 6) return degree;
  }
  throw new Error(`Mode ${mode} has no diminished modal fifth.`);
}

function leadDegreeAt(
  root: MusicRoot,
  tonicMidi: number,
  lead: readonly MusicCourseEvent[],
  startPulse: number,
  endPulse: number,
): number {
  const event =
    lead.find((candidate) => candidate.startPulse >= startPulse && candidate.startPulse < endPulse) ??
    [...lead].reverse().find((candidate) => candidate.startPulse < endPulse);
  return event ? (modalDegreeForPitch(root, tonicMidi, event.pitches[0]) ?? 0) : 0;
}

function rhythmChord(
  root: MusicRoot,
  tonicMidi: number,
  melodyDegree: number,
  courses: 2 | 3,
  closedCadence: boolean,
  random: () => number,
): readonly [number, ...number[]] {
  // A chord rooted on the tritone degree would stack a diminished fifth
  // inside itself, so that unstable degree never carries a strum.
  const forbidden = tritoneRootDegree(root.mode);
  const containingRoots = [melodyDegree - 4, melodyDegree - 2, melodyDegree].filter(
    (degree) => ((degree % 7) + 7) % 7 !== forbidden,
  );
  const rootDegree = closedCadence ? 0 : pickMusicValue(containingRoots.length > 0 ? containingRoots : [0], random);
  const rootPitch = fitToRangeNear(scaleNote(root.mode, tonicMidi, rootDegree), [RHYTHM_LOWEST, 55], null);
  const third = fitToRangeNear(
    scaleNote(root.mode, tonicMidi, rootDegree + 2),
    [rootPitch + 2, RHYTHM_HIGHEST],
    rootPitch,
  );
  const fifth = fitToRangeNear(scaleNote(root.mode, tonicMidi, rootDegree + 4), [rootPitch + 5, RHYTHM_HIGHEST], third);
  return courses === 2 ? [rootPitch, fifth] : [rootPitch, third, fifth];
}

/**
 * The sustained support a drone root sounds instead of chords: the final and
 * its perfect fifth (an octave course when three are allowed), re-struck on
 * the same selected bars a strummed root uses. Degree 4 is a perfect fifth
 * in every mode the repertoire plays, so the drone is consonant with the
 * final by construction.
 */
function droneChord(root: MusicRoot, tonicMidi: number, courses: 2 | 3): readonly [number, ...number[]] {
  const final = fitToRangeNear(tonicMidi, [RHYTHM_LOWEST, 55], null);
  const fifth = fitToRangeNear(scaleNote(root.mode, tonicMidi, 4), [final + 5, RHYTHM_HIGHEST], final);
  return courses === 2 ? [final, fifth] : [final, fifth, final + 12];
}

/** One accompaniment gesture on the second lute. */
function strum(
  startPulse: number,
  durationPulses: number,
  pitches: readonly [number, ...number[]],
  velocity: number,
  accent: boolean,
): MusicCourseEvent {
  return {
    kind: "course",
    part: "rhythm",
    startPulse,
    durationPulses,
    pitches,
    velocity,
    articulation: accent ? "accent" : "normal",
  };
}

/**
 * Compose the second lute, the song's company and frame. Chord roots
 * establish harmony on selected bars of refrain sections with dyads or
 * triads; drone roots sustain the final and fifth instead. Verses thin to a
 * quiet drone (drone roots) or silence (chord roots) so the lead sings
 * alone; a prelude intones the final and fifth before the body; interludes
 * take the tune itself, strumming the phrase's per-bar modal harmony while
 * the lead rests; and a bridged caesura bar holds the final's open fifth
 * between a verse and what follows. Its events form their own line and may
 * overlap the lead lute.
 *
 * Bar 0 of every refrain and postlude always sounds, whatever the density —
 * the guarantee `describeMusicPiece` leans on to report the rhythm lute
 * without composing.
 */
export function createRhythmLutePart(
  root: MusicRoot,
  tonicMidi: number,
  config: Readonly<MusicRhythmLuteConfig>,
  variationSeed: number,
  sections: readonly MusicSection[],
  lead: readonly MusicCourseEvent[],
): MusicCourseEvent[] {
  const barPulses = pulsesPerBar(root.meter);
  const drone = root.rhythmLuteTechnique === "drone";
  const planned: MusicCourseEvent[] = [];
  sections.forEach((section, sectionIndex) => {
    const spanPulses = section.lengthPulses - section.bridgePulses;
    const spanStart = section.startPulse;
    for (let bar = 0; bar < section.bars; bar += 1) {
      const random = createMusicRandom(mixMusicSeed(variationSeed, sectionIndex * 257 + bar, RHYTHM_PATTERN_SALT));
      const barStart = spanStart + bar * barPulses;
      if (section.role === "prelude") {
        // Intonation: the final's sonority, then its fifth, before anyone sings.
        const pitches = drone
          ? droneChord(root, tonicMidi, config.maxCourses)
          : rhythmChord(root, tonicMidi, bar === 0 ? 0 : 4, config.maxCourses, bar === 0, random);
        planned.push(strum(barStart, barPulses, pitches, bar === 0 ? 0.44 : 0.4, bar === 0));
        continue;
      }
      if (section.role === "interlude") {
        // The tune handed to the accompanist: a strum on every bar of the
        // phrase the lead would have sung.
        const pitches = drone
          ? droneChord(root, tonicMidi, config.maxCourses)
          : rhythmChord(
              root,
              tonicMidi,
              leadDegreeAt(root, tonicMidi, lead, barStart, barStart + barPulses),
              config.maxCourses,
              false,
              random,
            );
        planned.push(strum(barStart, barPulses, pitches, drone ? 0.48 : 0.5 + random() * 0.08, true));
        continue;
      }
      if (section.role === "verse") {
        // The lead sings alone; a drone root keeps only its quiet final and
        // fifth beneath, re-struck every other bar. The re-strike never
        // sounds past the span, so an odd number of bars leaves the caesura
        // bar to the bridge alone.
        if (drone && bar % 2 === 0) {
          const remainingPulses = spanPulses - bar * barPulses;
          planned.push(
            strum(
              barStart,
              Math.min(barPulses * 2, remainingPulses),
              droneChord(root, tonicMidi, config.maxCourses),
              0.34,
              bar === 0,
            ),
          );
        }
        continue;
      }
      // Refrain and postlude: the full company's chordal support.
      const selected = bar === 0 || random() < 0.18 + config.density * 0.62;
      if (!selected) continue;
      const offsets = config.density >= 0.72 && random() < config.density * 0.55 ? [0, barPulses / 2] : [0];
      offsets.forEach((offset, gestureIndex) => {
        const startPulse = barStart + offset;
        const closedCadence = bar === section.bars - 1 && section.cadence === "closed" && gestureIndex === 0;
        const courses: 2 | 3 = config.maxCourses === 2 ? 2 : closedCadence || random() < 0.78 ? 3 : 2;
        const pitches = drone
          ? droneChord(root, tonicMidi, courses)
          : rhythmChord(
              root,
              tonicMidi,
              leadDegreeAt(root, tonicMidi, lead, startPulse, barStart + barPulses),
              courses,
              closedCadence,
              random,
            );
        planned.push(strum(startPulse, barPulses - offset, pitches, 0.46 + random() * 0.1, gestureIndex === 0));
      });
    }
    if (section.bridgePulses > 0) {
      // The caesura bar: the second lute holds the final's open fifth —
      // never a stacked third, so a sustained passage keeps the hollow
      // communal sonority — while the lead breathes; the postlude's bridge
      // is the final rung out.
      const isPostlude = section.role === "postlude";
      planned.push(
        strum(
          spanStart + spanPulses,
          section.bridgePulses,
          droneChord(root, tonicMidi, config.maxCourses),
          isPostlude ? 0.5 : 0.4,
          isPostlude,
        ),
      );
    }
  });
  planned.sort((left, right) => left.startPulse - right.startPulse);
  return planned.map((event, index) => {
    const next = planned[index + 1];
    return next && event.startPulse + event.durationPulses > next.startPulse
      ? { ...event, durationPulses: next.startPulse - event.startPulse }
      : event;
  });
}
