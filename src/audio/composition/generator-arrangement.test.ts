import { describe, expect, test } from "vitest";
import { config, courseEvents, eventsInSpan, rhythmEvents, sectionSpanEnd } from "../tavern-music.test-support";
import { DEFAULT_MUSIC_CHORDS } from "./chord-config";
import { generateMusicPiece, getPerformanceVariation } from "./generator";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "./rhythm-lute-config";
import { MUSIC_ROOTS, type MusicPieceForm, type MusicRootId } from "./roots";

describe("music generation arrangement", () => {
  test("lets chord amount disable harmony and maximum courses limit it to dyads", () => {
    const withoutChords = generateMusicPiece(config("hearth", { chords: { ...DEFAULT_MUSIC_CHORDS, amount: 0 } }));
    expect(courseEvents(withoutChords).every((event) => event.pitches.length === 1)).toBe(true);

    const dyads = generateMusicPiece(
      config("hearth", { chords: { ...DEFAULT_MUSIC_CHORDS, amount: 1, maxCourses: 2 } }),
    );
    expect(courseEvents(dyads).some((event) => event.pitches.length === 2)).toBe(true);
    expect(courseEvents(dyads).every((event) => event.pitches.length <= 2)).toBe(true);
  });

  test("gives every generated piece a rhythm lute", () => {
    for (const root of MUSIC_ROOTS) {
      for (let seed = 1; seed <= 24; seed += 1) {
        const piece = generateMusicPiece(config(root.id, { masterSeed: seed }));
        expect(rhythmEvents(piece).length).toBeGreaterThan(0);
        expect(
          piece.sections
            .filter((section) => section.role !== "verse")
            .every((section) => section.activeParts.includes("rhythm")),
        ).toBe(true);
      }
    }
  });

  test("frames every song with a second-lute prelude and a tutti coda", () => {
    for (const root of MUSIC_ROOTS) {
      for (let seed = 1; seed <= 4; seed += 1) {
        const piece = generateMusicPiece(config(root.id, { masterSeed: seed }));
        const prelude = piece.sections[0]!;
        expect(prelude.role).toBe("prelude");
        expect(prelude.activeParts).toEqual(["rhythm"]);
        expect(eventsInSpan(piece, "strings", 0, prelude.lengthPulses)).toHaveLength(0);
        const intonation = eventsInSpan(piece, "rhythm", 0, prelude.lengthPulses);
        expect(intonation.length).toBeGreaterThanOrEqual(2);
        expect(Math.min(...intonation[0]!.pitches) % 12).toBe(piece.tonicMidi % 12);

        const coda = piece.sections.at(-1)!;
        expect(coda.role).toBe("postlude");
        expect(coda.activeParts).toEqual(["strings", "rhythm"]);
        expect(eventsInSpan(piece, "strings", coda.startPulse, sectionSpanEnd(coda)).length).toBeGreaterThan(0);
        // The piece's final event is the coda's rung-out, not a melody note.
        const last = piece.events.at(-1)!;
        expect(last.part).toBe("rhythm");
        expect(last.startPulse + last.durationPulses).toBe(piece.totalPulses);
      }
    }
  });

  test("sings verses solo and refrains with the full company", () => {
    // Every song form alternates solo verses with tutti refrains; the
    // estampie dances whole, through-strummed.
    const rootForForm: Record<MusicPieceForm, MusicRootId> = {
      strophic: "hearth",
      "paired-puncta": "road",
      "refrain-verse": "pilgrimage",
      ballata: "guildhall",
      ostinato: "revelry",
      "through-composed": "courtly",
    };
    for (const form of ["strophic", "refrain-verse", "ballata", "ostinato", "through-composed"] as const) {
      const piece = generateMusicPiece(config(rootForForm[form], { formOverride: form, masterSeed: 11 }));
      expect(piece.sections.some((section) => section.role === "verse")).toBe(true);
      expect(piece.sections.some((section) => section.role === "refrain")).toBe(true);
    }
    const dance = generateMusicPiece(config("road", { formOverride: "paired-puncta" }));
    expect(
      dance.sections.every(
        (section) => section.role === "refrain" || section.role === "prelude" || section.role === "postlude",
      ),
    ).toBe(true);
    for (const root of MUSIC_ROOTS) {
      for (let seed = 1; seed <= 4; seed += 1) {
        const piece = generateMusicPiece(config(root.id, { masterSeed: seed }));
        for (const section of piece.sections) {
          const spanEnd = sectionSpanEnd(section);
          if (section.role === "verse") {
            expect(eventsInSpan(piece, "strings", section.startPulse, spanEnd).length).toBeGreaterThan(0);
            const support = eventsInSpan(piece, "rhythm", section.startPulse, spanEnd);
            if (root.rhythmLuteTechnique === "drone") {
              // Only the quiet final-and-fifth drone may support the solo,
              // and its re-strikes never ring past the span into the caesura.
              for (const event of support) {
                expect(event.velocity).toBeLessThanOrEqual(0.36);
                expect(event.startPulse + event.durationPulses).toBeLessThanOrEqual(spanEnd);
                for (const pitch of event.pitches) {
                  expect([0, 7]).toContain((((pitch - piece.tonicMidi) % 12) + 12) % 12);
                }
              }
            } else {
              expect(support).toHaveLength(0);
            }
          }
          if (section.role === "refrain" || section.role === "postlude") {
            expect(eventsInSpan(piece, "strings", section.startPulse, spanEnd).length).toBeGreaterThan(0);
            expect(eventsInSpan(piece, "rhythm", section.startPulse, spanEnd).length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test("bridges the caesura with the second lute while the lead rests", () => {
    for (const root of MUSIC_ROOTS) {
      const piece = generateMusicPiece(config(root.id, { masterSeed: 5 }));
      const bridged = piece.sections.filter((section) => section.bridgePulses > 0);
      expect(bridged.length).toBeGreaterThan(0);
      for (const section of bridged) {
        const spanEnd = sectionSpanEnd(section);
        const sectionEnd = section.startPulse + section.lengthPulses;
        expect(eventsInSpan(piece, "strings", spanEnd, sectionEnd)).toHaveLength(0);
        const sustain = eventsInSpan(piece, "rhythm", spanEnd, spanEnd + 1);
        expect(sustain).toHaveLength(1);
        expect(sustain[0]!.durationPulses).toBe(section.bridgePulses);
        // The caesura holds an open sonority on the final: no thirds inside.
        for (const pitch of sustain[0]!.pitches) {
          expect([0, 7]).toContain((((pitch - piece.tonicMidi) % 12) + 12) % 12);
        }
      }
    }
  });

  test("hands the tune to the second lute in interludes", () => {
    const piece = generateMusicPiece(config("pilgrimage", { formOverride: "refrain-verse", masterSeed: 3 }));
    const interludes = piece.sections.filter((section) => section.role === "interlude");
    expect(interludes.length).toBeGreaterThan(0);
    for (const section of interludes) {
      const spanEnd = section.startPulse + section.lengthPulses;
      expect(eventsInSpan(piece, "strings", section.startPulse, spanEnd)).toHaveLength(0);
      // A strum on every bar of the phrase the lead would have sung.
      expect(eventsInSpan(piece, "rhythm", section.startPulse, spanEnd)).toHaveLength(section.bars);
    }
  });

  test("writes the rhythm lute as an independent chord-first line", () => {
    const piece = generateMusicPiece(
      config("road", {
        rhythmLute: { ...DEFAULT_MUSIC_RHYTHM_LUTE, density: 1 },
      }),
    );
    const lead = courseEvents(piece);
    const rhythm = rhythmEvents(piece);
    expect(rhythm.length).toBeGreaterThan(piece.sections.length);
    expect(rhythm.every((event) => event.pitches.length >= 2 && event.pitches.length <= 3)).toBe(true);
    expect(piece.sections.every((section) => section.activeParts.includes("rhythm"))).toBe(true);
    rhythm.forEach((event, index) => {
      const next = rhythm[index + 1];
      if (next) expect(event.startPulse + event.durationPulses).toBeLessThanOrEqual(next.startPulse);
    });
    expect(
      rhythm.some((chord) =>
        lead.some(
          (note) =>
            note.startPulse < chord.startPulse + chord.durationPulses &&
            chord.startPulse < note.startPulse + note.durationPulses,
        ),
      ),
    ).toBe(true);
  });

  test("retains the rhythm lute at minimum density and can constrain it to dyads", () => {
    const minimum = generateMusicPiece(config("hearth", { rhythmLute: { ...DEFAULT_MUSIC_RHYTHM_LUTE, density: 0 } }));
    expect(rhythmEvents(minimum).length).toBeGreaterThanOrEqual(minimum.sections.length);
    expect(minimum.sections.every((section) => section.activeParts.includes("rhythm"))).toBe(true);

    const dyads = generateMusicPiece(
      config("hearth", {
        rhythmLute: { ...DEFAULT_MUSIC_RHYTHM_LUTE, density: 1, maxCourses: 2 },
      }),
    );
    expect(rhythmEvents(dyads).length).toBeGreaterThan(0);
    expect(rhythmEvents(dyads).every((event) => event.pitches.length === 2)).toBe(true);
  });

  test("rhythm-lute density does not reseed the lead performance", () => {
    const sparse = generateMusicPiece(config("road", { rhythmLute: { ...DEFAULT_MUSIC_RHYTHM_LUTE, density: 0 } }));
    const busy = generateMusicPiece(config("road", { rhythmLute: { ...DEFAULT_MUSIC_RHYTHM_LUTE, density: 1 } }));
    const sparseLead = courseEvents(sparse);
    const busyLead = courseEvents(busy);
    expect(busyLead).toEqual(sparseLead);
    sparseLead.forEach((event, leadIndex) => {
      expect(getPerformanceVariation(busy, busy.events.indexOf(busyLead[leadIndex]!), 1)).toEqual(
        getPerformanceVariation(sparse, sparse.events.indexOf(event), 1),
      );
    });
  });

  test("closes pieces on unisons, octaves, and fifths", () => {
    for (const root of MUSIC_ROOTS) {
      for (let seed = 1; seed <= 8; seed += 1) {
        const piece = generateMusicPiece(config(root.id, { masterSeed: seed }));
        const finalPitches = courseEvents(piece)
          .filter((event) => event.startPulse + event.durationPulses === piece.totalPulses)
          .flatMap((event) => event.pitches);
        const lowest = Math.min(...finalPitches);
        expect(finalPitches.every((pitch) => [0, 7].includes((((pitch - lowest) % 12) + 12) % 12))).toBe(true);
      }
    }
  });
});
