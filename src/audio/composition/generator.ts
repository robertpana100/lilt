import {
  MUSIC_PARTS,
  PULSES_PER_QUARTER,
  getMusicRoot,
  type MusicPart,
  type MusicPieceForm,
  type MusicRoot,
  type MusicRootId,
} from "./roots";
import { createSectionPlan } from "./form";
import { cadenceFor, createPhrase } from "./phrase";
import { clamp } from "./pitch";
import { createMusicRandom, mixMusicSeed, pickMusicValue } from "./random";
import type {
  MusicCourseEvent,
  MusicEvent,
  MusicGeneratorConfig,
  MusicPhrase,
  MusicPiece,
  MusicSection,
} from "./types";
import { renderLead } from "./parts/lead";
import { voiceLuteChords } from "./chords";
import { createRhythmLutePart } from "./rhythm-lute";

export type {
  MusicArticulation,
  MusicCadence,
  MusicEvent,
  MusicCourseEvent,
  MusicGeneratorConfig,
  MusicPhrase,
  MusicPhraseNote,
  MusicPiece,
  MusicSection,
  MusicSectionRole,
  PerformanceVariation,
  PhraseTransform,
} from "./types";
export { mixMusicSeed } from "./random";
export { getPerformanceVariation } from "./performance";

/** A piece's configuration without the repertoire's advance policy, which
 * composing (or describing) a single piece never reads. */
export type MusicPieceConfig = Omit<MusicGeneratorConfig, "autoAdvance">;

/**
 * The head of composition: everything a piece determines before a single
 * phrase or event is written. Shared by `generateMusicPiece` and
 * `describeMusicPiece` so the cheap description can never drift from the
 * composed piece; the random streams are returned mid-flight because
 * composition continues drawing from them in this exact order.
 */
interface MusicPiecePlan {
  root: MusicRoot;
  novelty: number;
  compositionSeed: number;
  variationSeed: number;
  performanceSeed: number;
  compositionRandom: () => number;
  variationRandom: () => number;
  tonicMidi: number;
  form: MusicPieceForm;
  pulseSeconds: number;
  sections: MusicSection[];
  totalPulses: number;
}

function planMusicPiece(config: MusicPieceConfig): MusicPiecePlan {
  const root = getMusicRoot(config.rootId);
  const novelty = clamp(config.novelty);
  const compositionSeed = mixMusicSeed(config.masterSeed, config.pieceIndex, 0x434f4d50);
  const variationSeed = mixMusicSeed(compositionSeed, config.variationIndex, 0x56415249);
  const performanceSeed = mixMusicSeed(compositionSeed, config.performanceIndex, 0x50455246);
  const compositionRandom = createMusicRandom(compositionSeed);
  const variationRandom = createMusicRandom(variationSeed);
  const tonicMidi = config.tonicOverride ?? pickMusicValue(root.safeTonics, compositionRandom);
  const defaultForm = root.forms[0];
  if (!defaultForm) throw new Error(`Music root ${root.id} does not define any forms.`);
  const form =
    config.formOverride && root.forms.includes(config.formOverride)
      ? config.formOverride
      : novelty < 0.25
        ? defaultForm
        : pickMusicValue(root.forms, compositionRandom);
  const pulseSeconds = 60 / config.bpm / PULSES_PER_QUARTER;
  const targetSeconds = 90 + compositionRandom() * 90;
  const sections = createSectionPlan(
    root,
    form,
    targetSeconds,
    pulseSeconds,
    novelty,
    compositionRandom,
    variationRandom,
  );
  const finalSection = sections.at(-1);
  if (!finalSection) throw new Error(`Music form ${form} did not create any sections.`);
  const totalPulses = finalSection.startPulse + finalSection.lengthPulses;
  return {
    root,
    novelty,
    compositionSeed,
    variationSeed,
    performanceSeed,
    compositionRandom,
    variationRandom,
    tonicMidi,
    form,
    pulseSeconds,
    sections,
    totalPulses,
  };
}

/**
 * What a piece is, without its music: identity, form, tempo, length, and the
 * parts its sections will write events for. Cheap enough to compute for every
 * row of a saved library, where composing phrases and events for each entry
 * is not.
 */
export interface MusicPieceDescription {
  rootId: MusicRootId;
  pieceIndex: number;
  compositionSeed: number;
  variationSeed: number;
  performanceSeed: number;
  tonicMidi: number;
  form: MusicPieceForm;
  bpm: number;
  durationSeconds: number;
  /** The parts that will carry events, in `MUSIC_PARTS` order, mutes ignored. */
  soundingParts: readonly MusicPart[];
}

/** Describe the piece a config would compose, without composing it. */
export function describeMusicPiece(config: MusicPieceConfig): MusicPieceDescription {
  const plan = planMusicPiece(config);
  const sounding = new Set<MusicPart>(plan.sections.flatMap((section) => section.activeParts));
  // The prelude's intonation guarantees the second lute and any verse
  // guarantees the lead, so the plan alone names both sounding parts.
  return {
    rootId: config.rootId,
    pieceIndex: config.pieceIndex,
    compositionSeed: plan.compositionSeed,
    variationSeed: plan.variationSeed,
    performanceSeed: plan.performanceSeed,
    tonicMidi: plan.tonicMidi,
    form: plan.form,
    bpm: config.bpm,
    durationSeconds: plan.totalPulses * plan.pulseSeconds,
    soundingParts: MUSIC_PARTS.filter((part) => sounding.has(part)),
  };
}

/** The same description, read off a piece that is already composed. */
export function musicPieceDescription(piece: MusicPiece): MusicPieceDescription {
  const sounding = new Set(piece.events.map((event) => event.part));
  return {
    rootId: piece.rootId,
    pieceIndex: piece.pieceIndex,
    compositionSeed: piece.compositionSeed,
    variationSeed: piece.variationSeed,
    performanceSeed: piece.performanceSeed,
    tonicMidi: piece.tonicMidi,
    form: piece.form,
    bpm: piece.bpm,
    durationSeconds: piece.durationSeconds,
    soundingParts: MUSIC_PARTS.filter((part) => sounding.has(part)),
  };
}

export function generateMusicPiece(config: MusicGeneratorConfig): MusicPiece {
  const {
    root,
    novelty,
    compositionSeed,
    variationSeed,
    performanceSeed,
    compositionRandom,
    tonicMidi,
    form,
    pulseSeconds,
    sections,
    totalPulses,
  } = planMusicPiece(config);
  const phraseMap = new Map<string, MusicPhrase>();
  sections.forEach((section) => {
    // The prelude borrows a phrase identity for display but sings nothing;
    // every other section — interludes included — needs its phrase written.
    if (section.role === "prelude" || phraseMap.has(section.phraseId)) return;
    phraseMap.set(section.phraseId, createPhrase(root, section.phraseId, section.bars, compositionRandom));
  });

  const events: MusicEvent[] = [];
  // An interlude's phrase is rendered for its harmony alone: the strummed
  // chords follow where the melody would have gone, but the line itself
  // never joins the piece's events.
  const scratchEvents: MusicEvent[] = [];
  sections.forEach((section, sectionIndex) => {
    if (section.role === "prelude") return;
    const phrase = phraseMap.get(section.phraseId);
    if (!phrase) throw new Error(`Section ${section.id} references missing phrase ${section.phraseId}.`);
    const cadence = cadenceFor(root, section.cadence, variationSeed, sectionIndex);
    renderLead(
      root,
      section,
      phrase,
      cadence,
      tonicMidi,
      novelty,
      totalPulses,
      section.role === "interlude" ? scratchEvents : events,
    );
  });

  events.sort((left, right) => left.startPulse - right.startPulse);
  // One string event may voice several courses, but separate string gestures
  // do not overlap.
  const nonOverlappingEvents: MusicCourseEvent[] = [];
  for (const event of events) {
    if (event.kind !== "course") continue;
    const previous = nonOverlappingEvents.at(-1);
    if (previous && previous.startPulse + previous.durationPulses > event.startPulse) {
      const shortened = event.startPulse - previous.startPulse;
      if (shortened <= 0) nonOverlappingEvents.pop();
      else nonOverlappingEvents.splice(-1, 1, { ...previous, durationPulses: shortened });
    }
    nonOverlappingEvents.push({ ...event, part: "strings", pitches: [event.pitches[0]] });
  }
  const voicedEvents = voiceLuteChords(
    root,
    tonicMidi,
    novelty,
    config.chords,
    variationSeed,
    sections,
    nonOverlappingEvents,
  );
  const rhythmEvents = createRhythmLutePart(
    root,
    tonicMidi,
    config.rhythmLute,
    variationSeed,
    sections,
    [...voicedEvents, ...scratchEvents].sort((left, right) => left.startPulse - right.startPulse),
  );
  const performedEvents: MusicEvent[] = [...voicedEvents, ...rhythmEvents].sort(
    (left, right) => left.startPulse - right.startPulse,
  );
  return {
    rootId: config.rootId,
    pieceIndex: config.pieceIndex,
    compositionSeed,
    variationSeed,
    performanceSeed,
    tonicMidi,
    mode: root.mode,
    meter: root.meter,
    form,
    bpm: config.bpm,
    pulseSeconds,
    sections,
    events: performedEvents,
    phrases: [...phraseMap.values()],
    totalPulses,
    durationSeconds: totalPulses * pulseSeconds,
    gapSeconds: 4 + compositionRandom() * 8,
  };
}

export function generateNextMusicPiece(config: MusicGeneratorConfig, currentPieceIndex: number): MusicPiece | null {
  return config.autoAdvance
    ? generateMusicPiece({
        ...config,
        pieceIndex: currentPieceIndex + 1,
      })
    : null;
}
