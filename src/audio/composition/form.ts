import { pulsesPerBar, type MusicPart, type MusicPieceForm, type MusicRoot } from "./roots";
import { pickMusicValue } from "./random";
import type { MusicCadence, MusicSection, MusicSectionRole, PhraseTransform } from "./types";

/**
 * The responsorial shape every body entry declares: a verse is the lead
 * lute's solo statement (quiet drone beneath the drone roots), a refrain is
 * the full company with the second lute strumming, and an interlude hands
 * the tune to the second lute alone while the lead rests.
 */
type BodyRole = "verse" | "refrain" | "interlude";

interface FormEntry {
  phraseId: string;
  label: string;
  cadence: MusicCadence;
  role: BodyRole;
  /** Whether a bridged caesura bar follows, sustained by the second lute. */
  bridged: boolean;
}

/** The instrumental frame around the body: prelude and closing postlude. */
interface FormFrame {
  phraseId: string;
  label: string;
}

interface FormShape {
  body: readonly FormEntry[];
  prelude: FormFrame;
  postlude: FormFrame;
}

const PRELUDE_LABEL = "Prelude";
const POSTLUDE_LABEL = "Coda";

const FORM_SHAPES: Readonly<Record<MusicPieceForm, FormShape>> = {
  // The strophe is sung, then repeated by the full company — the carole's
  // responsorial stanza — before the departure takes it back down.
  strophic: {
    body: [
      { phraseId: "A", label: "Strophe", cadence: "open", role: "verse", bridged: true },
      { phraseId: "A", label: "Repeated strophe", cadence: "closed", role: "refrain", bridged: false },
      { phraseId: "B", label: "Departure", cadence: "deceptive", role: "verse", bridged: true },
      { phraseId: "A", label: "Return", cadence: "closed", role: "refrain", bridged: false },
    ],
    prelude: { phraseId: "A", label: PRELUDE_LABEL },
    postlude: { phraseId: "A", label: POSTLUDE_LABEL },
  },
  // An estampie dances whole: puncta stated twice with open then closed
  // endings, the second lute strumming throughout.
  "paired-puncta": {
    body: [
      { phraseId: "A", label: "Punctum I · open", cadence: "open", role: "refrain", bridged: false },
      { phraseId: "A", label: "Punctum I · closed", cadence: "closed", role: "refrain", bridged: false },
      { phraseId: "B", label: "Punctum II · open", cadence: "open", role: "refrain", bridged: false },
      { phraseId: "B", label: "Punctum II · closed", cadence: "closed", role: "refrain", bridged: false },
    ],
    prelude: { phraseId: "A", label: PRELUDE_LABEL },
    postlude: { phraseId: "A", label: POSTLUDE_LABEL },
  },
  // The carole: the ring answers every solo verse with the communal
  // refrain, and the instruments take the tune between stanzas.
  "refrain-verse": {
    body: [
      { phraseId: "R", label: "Refrain", cadence: "closed", role: "refrain", bridged: false },
      { phraseId: "V", label: "Verse", cadence: "open", role: "verse", bridged: true },
      { phraseId: "R", label: "Refrain", cadence: "closed", role: "refrain", bridged: false },
      { phraseId: "W", label: "Answering verse", cadence: "deceptive", role: "verse", bridged: true },
      { phraseId: "R", label: "Interlude", cadence: "open", role: "interlude", bridged: false },
    ],
    prelude: { phraseId: "R", label: PRELUDE_LABEL },
    postlude: { phraseId: "R", label: POSTLUDE_LABEL },
  },
  // AbbaA: the ripresa frames the solo piedi, the volta sings the ripresa's
  // melody back into the returning refrain.
  ballata: {
    body: [
      { phraseId: "R", label: "Ripresa", cadence: "closed", role: "refrain", bridged: false },
      { phraseId: "P", label: "Primo piede", cadence: "open", role: "verse", bridged: true },
      { phraseId: "P", label: "Secondo piede", cadence: "closed", role: "verse", bridged: true },
      { phraseId: "R", label: "Volta", cadence: "open", role: "verse", bridged: true },
      { phraseId: "R", label: "Ripresa", cadence: "closed", role: "refrain", bridged: false },
    ],
    prelude: { phraseId: "R", label: PRELUDE_LABEL },
    postlude: { phraseId: "R", label: POSTLUDE_LABEL },
  },
  // The ground carries the dance; the answer is a solo call before the
  // ground returns with the full company.
  ostinato: {
    body: [
      { phraseId: "O", label: "Ground", cadence: "open", role: "refrain", bridged: false },
      { phraseId: "O", label: "Ground", cadence: "closed", role: "refrain", bridged: false },
      { phraseId: "A", label: "Answer", cadence: "deceptive", role: "verse", bridged: true },
      { phraseId: "O", label: "Return", cadence: "closed", role: "refrain", bridged: false },
    ],
    prelude: { phraseId: "O", label: PRELUDE_LABEL },
    postlude: { phraseId: "O", label: POSTLUDE_LABEL },
  },
  "through-composed": {
    body: [
      { phraseId: "A", label: "Opening", cadence: "open", role: "verse", bridged: true },
      { phraseId: "B", label: "Descent", cadence: "deceptive", role: "verse", bridged: true },
      { phraseId: "C", label: "Turning", cadence: "open", role: "refrain", bridged: false },
      { phraseId: "D", label: "Arrival", cadence: "closed", role: "refrain", bridged: false },
    ],
    // The frame needs identities the suffixed body never owns.
    prelude: { phraseId: "I", label: PRELUDE_LABEL },
    postlude: { phraseId: "Z", label: POSTLUDE_LABEL },
  },
};

const TRANSFORMS = [
  "identity",
  "sequence-up",
  "sequence-down",
  "answer",
  "ornament",
  "rhythmic-variation",
] as const satisfies readonly [PhraseTransform, ...PhraseTransform[]];

function transformFor(
  form: MusicPieceForm,
  occurrence: number,
  novelty: number,
  random: () => number,
): PhraseTransform {
  if (occurrence === 0 || form === "paired-puncta") return "identity";
  const maximum = Math.min(TRANSFORMS.length - 1, 1 + Math.floor(novelty * (TRANSFORMS.length - 1)));
  return pickMusicValue(TRANSFORMS.slice(0, maximum + 1), random);
}

function activePartsFor(role: MusicSectionRole, root: MusicRoot): readonly MusicPart[] {
  switch (role) {
    case "prelude":
    case "interlude":
      return ["rhythm"];
    case "verse":
      // A verse over the drone roots keeps its quiet final-and-fifth drone:
      // the documented accompaniment for secular monody.
      return root.rhythmLuteTechnique === "drone" ? ["strings", "rhythm"] : ["strings"];
    case "refrain":
    case "postlude":
      return ["strings", "rhythm"];
  }
}

/**
 * The parts a planned section carries — and, because every active part is
 * guaranteed to write events, exactly the parts that will sound. The plan is
 * authoritative: a library row reads a lineup off it without composing. The
 * prelude guarantees the second lute and any verse guarantees the lead, so
 * every composed piece sounds both parts.
 */
export function createSectionPlan(
  root: MusicRoot,
  form: MusicPieceForm,
  targetSeconds: number,
  pulseSeconds: number,
  novelty: number,
  compositionRandom: () => number,
  variationRandom: () => number,
): MusicSection[] {
  const shape = FORM_SHAPES[form];
  const barPulses = pulsesPerBar(root.meter);
  const phraseBars = new Map<string, number>();
  const sections: MusicSection[] = [];
  const occurrences = new Map<string, number>();
  let startPulse = 0;
  let cycle = 0;

  const barsFor = (identity: string): number => {
    let bars = phraseBars.get(identity);
    if (bars === undefined) {
      bars = pickMusicValue(root.style.phraseBars, compositionRandom);
      phraseBars.set(identity, bars);
    }
    return bars;
  };
  const push = (entry: FormEntry, identity: string, role: MusicSectionRole, bars: number, bridged: boolean) => {
    const occurrence = occurrences.get(identity) ?? 0;
    occurrences.set(identity, occurrence + 1);
    const bridgePulses = bridged ? barPulses : 0;
    sections.push({
      id: `${identity}${occurrence + 1}`,
      phraseId: identity,
      label: entry.label,
      role,
      occurrence,
      startPulse,
      lengthPulses: bars * barPulses + bridgePulses,
      bars,
      cadence: entry.cadence,
      transform: transformFor(form, occurrence, novelty, variationRandom),
      bridgePulses,
      activeParts: activePartsFor(role, root),
    });
    startPulse += bars * barPulses + bridgePulses;
  };

  const preludePulses = 2 * barPulses;
  const postludePulses = barsFor(shape.postlude.phraseId) * barPulses + barPulses;
  // The frame and the caesura bars count against the same 90–180 second
  // budget the body fills.
  const framePulses = preludePulses + postludePulses;
  const capPulses = Math.min(targetSeconds, 180) / pulseSeconds;

  while (cycle < 32) {
    const pending = shape.body.map((entry) => {
      const identity = form === "through-composed" ? `${entry.phraseId}${cycle + 1}` : entry.phraseId;
      return { entry, identity, bars: barsFor(identity) };
    });
    const cyclePulses = pending.reduce((sum, item) => sum + (item.bars + (item.entry.bridged ? 1 : 0)) * barPulses, 0);
    const filledPulses = startPulse;
    const projectedPulses = framePulses + filledPulses + cyclePulses;
    // The body alone must reach the 90-second floor before the plan may
    // stop, and the frame counts against the same 180-second ceiling.
    if (sections.length > 0 && filledPulses * pulseSeconds >= 90 && projectedPulses > capPulses) break;
    for (const item of pending) {
      push(item.entry, item.identity, item.entry.role, item.bars, item.entry.bridged);
    }
    cycle += 1;
  }

  // The instrumental frame: an intonation before the body, and the refrain's
  // own melody rung out by the full company after it.
  sections.unshift({
    id: `${shape.prelude.phraseId}0`,
    phraseId: shape.prelude.phraseId,
    label: shape.prelude.label,
    role: "prelude",
    occurrence: 0,
    startPulse: 0,
    lengthPulses: preludePulses,
    bars: 2,
    cadence: "open",
    transform: "identity",
    bridgePulses: 0,
    activeParts: activePartsFor("prelude", root),
  });
  const bodyEnd = startPulse;
  sections.forEach((section, index) => {
    if (index > 0) section.startPulse += preludePulses;
  });
  const postludeBars = barsFor(shape.postlude.phraseId);
  sections.push({
    id: `${shape.postlude.phraseId}${(occurrences.get(shape.postlude.phraseId) ?? 0) + 1}`,
    phraseId: shape.postlude.phraseId,
    label: shape.postlude.label,
    role: "postlude",
    occurrence: occurrences.get(shape.postlude.phraseId) ?? 0,
    startPulse: bodyEnd + preludePulses,
    lengthPulses: postludeBars * barPulses + barPulses,
    bars: postludeBars,
    cadence: "closed",
    transform: transformFor(form, occurrences.get(shape.postlude.phraseId) ?? 0, novelty, variationRandom),
    bridgePulses: barPulses,
    activeParts: activePartsFor("postlude", root),
  });

  return sections;
}
