import { describe, expect, test } from "vitest";
import { config, scriptedRandom, sectionMelody } from "../tavern-music.test-support";
import { DEFAULT_MUSIC_CHORDS } from "./chord-config";
import { modalDegreeForPitch, voiceLuteChords } from "./chords";
import { generateMusicPiece, type MusicCourseEvent, type MusicSection } from "./generator";
import { createPhrase } from "./phrase";
import { createMusicRandom } from "./random";
import { MUSIC_ROOTS, PULSES_PER_QUARTER, getMusicRoot, pulsesPerBar } from "./roots";

describe("music generation phrases and cadences", () => {
  test("uses varied phrase lengths and fine duple and ternary subdivisions", () => {
    const lengths = new Set<number>();
    const durations = new Set<number>();
    for (const root of MUSIC_ROOTS) {
      for (let seed = 1; seed <= 8; seed += 1) {
        const piece = generateMusicPiece(config(root.id, { masterSeed: seed }));
        piece.sections.forEach((section) => lengths.add(section.bars));
        piece.events.forEach((event) => durations.add(event.durationPulses));
      }
    }
    expect(lengths.size).toBeGreaterThanOrEqual(4);
    expect(durations.has(PULSES_PER_QUARTER / 3)).toBe(true);
    expect(durations.has(PULSES_PER_QUARTER / 4)).toBe(true);
  });

  test("paired puncta reuse one body with independently written endings", () => {
    const piece = generateMusicPiece(config("road", { formOverride: "paired-puncta", masterSeed: 71 }));
    // The prelude intones first; the first punctum pair follows it.
    const first = piece.sections[1]!;
    const second = piece.sections[2]!;
    expect(first.phraseId).toBe(second.phraseId);
    expect(first.cadence).toBe("open");
    expect(second.cadence).toBe("closed");
    const cadenceSlot = PULSES_PER_QUARTER * 3;
    const normalizeBody = (index: number) => {
      const section = piece.sections[index];
      if (!section) throw new Error(`Missing section ${index}.`);
      return sectionMelody(piece, index)
        .filter((event) => event.startPulse - section.startPulse < section.lengthPulses - cadenceSlot)
        .map((event) => [event.startPulse - section.startPulse, event.durationPulses, event.pitches[0]]);
    };
    expect(normalizeBody(1)).toEqual(normalizeBody(2));
    const openFinal = sectionMelody(piece, 1).at(-1)?.pitches[0];
    const closedFinal = sectionMelody(piece, 2).at(-1)?.pitches[0];
    expect(openFinal).toBeDefined();
    expect(closedFinal).toBeDefined();
    expect(openFinal! % 12).not.toBe(piece.tonicMidi % 12);
    expect(closedFinal! % 12).toBe(piece.tonicMidi % 12);
  });

  test("never sounds a tritone inside any course voicing", () => {
    for (const root of MUSIC_ROOTS) {
      for (let seed = 1; seed <= 6; seed += 1) {
        const piece = generateMusicPiece(
          config(root.id, { masterSeed: seed, chords: { ...DEFAULT_MUSIC_CHORDS, amount: 1 } }),
        );
        for (const event of piece.events) {
          for (let lower = 0; lower < event.pitches.length; lower += 1) {
            for (let upper = lower + 1; upper < event.pitches.length; upper += 1) {
              expect(Math.abs(event.pitches[lower]! - event.pitches[upper]!) % 12).not.toBe(6);
            }
          }
        }
      }
    }
  });

  test("substitutes the octave when stacked thirds would cross a tritone", () => {
    // D-dorian melody on F (degree 2): the scale's fifth below is B natural,
    // so a plain stacked-thirds voicing would sound the F–B tritone.
    const root = getMusicRoot("hearth");
    const section: MusicSection = {
      id: "probe",
      phraseId: "A",
      label: "Probe",
      role: "refrain",
      occurrence: 0,
      startPulse: 0,
      lengthPulses: 96,
      bars: 2,
      cadence: "open",
      transform: "identity",
      bridgePulses: 0,
      activeParts: ["strings", "rhythm"],
    };
    const melody: MusicCourseEvent = {
      kind: "course",
      part: "strings",
      startPulse: 0,
      durationPulses: PULSES_PER_QUARTER,
      pitches: [53],
      velocity: 0.5,
      articulation: "normal",
    };
    let triads = 0;
    for (let seed = 0; seed < 64; seed += 1) {
      const voiced = voiceLuteChords(
        root,
        50,
        0.5,
        { ...DEFAULT_MUSIC_CHORDS, amount: 1, maxCourses: 3 },
        seed,
        [section],
        [melody],
      );
      const pitches = voiced[0]!.pitches;
      expect(pitches).not.toContain(47);
      if (pitches.length === 3) {
        triads += 1;
        expect(pitches).toContain(50);
        expect(pitches).toContain(41);
      }
    }
    expect(triads).toBeGreaterThan(0);
  });

  test("cadence formulas sit on the eighth-note grid", () => {
    for (const root of MUSIC_ROOTS) {
      for (const patterns of Object.values(root.style.cadences)) {
        for (const cadence of patterns) {
          const total = cadence.durations.reduce((sum, duration) => sum + duration, 0);
          expect(total % 12).toBe(0);
          expect(cadence.durations.at(-1)).toBe(PULSES_PER_QUARTER);
        }
      }
    }
    // The forceful table belongs to the brawl's duple meter, where every
    // formula must total one bar so it opens on the final bar's downbeat.
    for (const cadence of Object.values(getMusicRoot("brawl").style.cadences).flat()) {
      expect(cadence.durations.reduce((sum, duration) => sum + duration, 0)).toBe(pulsesPerBar("2/4"));
    }
  });

  test("every accent falls on a quarter beat", () => {
    for (const root of MUSIC_ROOTS) {
      const piece = generateMusicPiece(config(root.id));
      for (const event of piece.events) {
        if (event.articulation === "accent") {
          expect(event.startPulse % PULSES_PER_QUARTER).toBe(0);
        }
      }
    }
  });

  test("deceptive cadences rest on the modal second degree", () => {
    for (const root of MUSIC_ROOTS) {
      for (const cadence of root.style.cadences.deceptive) {
        expect(cadence.degrees.at(-1)).toBe(2);
      }
    }
    const root = getMusicRoot("hearth");
    const piece = generateMusicPiece(config("hearth", { formOverride: "strophic" }));
    const departure = piece.sections.find((section) => section.cadence === "deceptive");
    expect(departure).toBeDefined();
    const finalPitch = sectionMelody(piece, piece.sections.indexOf(departure!)).at(-1)?.pitches[0];
    expect(finalPitch).toBeDefined();
    expect(modalDegreeForPitch(root, piece.tonicMidi, finalPitch!)! % 7).toBe(2);
  });

  test("ballata sings the volta on the ripresa's melody", () => {
    const piece = generateMusicPiece(config("guildhall", { formOverride: "ballata", masterSeed: 19 }));
    expect(piece.sections.slice(1, 6).map((section) => section.phraseId)).toEqual(["R", "P", "P", "R", "R"]);
    expect(piece.sections[4]?.label).toBe("Volta");
  });

  test("reserves fifth leaps for phrase openings", () => {
    for (const root of MUSIC_ROOTS) {
      for (let seed = 0; seed < 60; seed += 1) {
        const degrees = createPhrase(root, "A", 4, createMusicRandom(seed)).body.map((note) => note.degree);
        degrees.slice(1).forEach((degree, index) => {
          expect(Math.abs(degree - degrees[index]!)).toBeLessThanOrEqual(3);
        });
      }
    }
  });

  test("phrase openings occasionally take the psalmodic rising fifth", () => {
    // Scripted draws for the first note: pickup 0, starting degree 1, cell
    // [12, 12], weighted interval +1 (0.6), reciting degree 2, then the
    // opening-leap draw. The same phrase without the upgrade steps to 2.
    const leap = createPhrase(getMusicRoot("hearth"), "A", 4, scriptedRandom([0, 0, 0, 0.6, 0, 0]));
    expect(leap.body[0]?.degree).toBe(5);
    const step = createPhrase(getMusicRoot("hearth"), "A", 4, scriptedRandom([0, 0, 0, 0.6, 0, 0.5]));
    expect(step.body[0]?.degree).toBe(2);
  });
});
