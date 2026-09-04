import type {
  MusicMeter,
  MusicMode,
  MusicPart,
  MusicPieceForm,
  MusicRoot,
  MusicStyleProfile,
  NonEmptyReadonlyArray,
  WeightedMelodicInterval,
} from "./root-types";
export { LUTE_STYLES, getLuteStyle } from "./lute";
export type { LuteStyleId, LuteTechnique } from "./lute";
export type {
  MusicCadencePattern,
  MusicMeter,
  MusicMode,
  MusicPart,
  MusicPieceForm,
  MusicRoot,
  MusicStyleProfile,
  NonEmptyReadonlyArray,
  RhythmLuteTechnique,
  WeightedMelodicInterval,
} from "./root-types";

export const PULSES_PER_QUARTER = 24;

export const MUSIC_FORM_LABELS: Readonly<Record<MusicPieceForm, string>> = {
  strophic: "Strophic song",
  "paired-puncta": "Paired puncta",
  "refrain-verse": "Refrain and verse",
  ballata: "Ballata",
  ostinato: "Ostinato dance",
  "through-composed": "Through-composed",
};

export const MUSIC_PARTS = ["strings", "rhythm"] as const satisfies NonEmptyReadonlyArray<MusicPart>;

export const MUSIC_PART_LABELS: Readonly<Record<MusicPart, string>> = {
  strings: "Strings",
  rhythm: "Chord rhythm",
};

/** Shared all-audible default for every consumer of per-part mute flags. */
export const NO_MUTED_PARTS: Readonly<Record<MusicPart, boolean>> = Object.freeze({
  strings: false,
  rhythm: false,
});

export const MODE_INTERVALS: Record<MusicMode, NonEmptyReadonlyArray<number>> = {
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
};

export function pulsesPerBar(meter: MusicMeter): number {
  const [beatsText, denominatorText] = meter.split("/") as [string, string];
  const beats = Number(beatsText);
  const denominator = Number(denominatorText);
  return beats * PULSES_PER_QUARTER * (4 / denominator);
}

const SONG_INTERVALS: readonly WeightedMelodicInterval[] = [
  { steps: -3, weight: 1 },
  { steps: -2, weight: 6 },
  { steps: -1, weight: 23 },
  { steps: 0, weight: 9 },
  { steps: 1, weight: 22 },
  { steps: 2, weight: 6 },
  { steps: 3, weight: 1 },
];
const DANCE_INTERVALS: readonly WeightedMelodicInterval[] = [
  { steps: -3, weight: 2 },
  { steps: -2, weight: 8 },
  { steps: -1, weight: 21 },
  { steps: 0, weight: 8 },
  { steps: 1, weight: 21 },
  { steps: 2, weight: 8 },
  { steps: 3, weight: 2 },
];
const NARROW_INTERVALS: readonly WeightedMelodicInterval[] = [
  { steps: -2, weight: 5 },
  { steps: -1, weight: 28 },
  { steps: 0, weight: 12 },
  { steps: 1, weight: 25 },
  { steps: 2, weight: 4 },
];

const STANDARD_CADENCES: MusicStyleProfile["cadences"] = {
  open: [
    { degrees: [2, 3, 4], durations: [12, 12, 24] },
    { degrees: [6, 5, 4], durations: [12, 12, 24] },
  ],
  closed: [
    { degrees: [4, 2, 1, 0], durations: [12, 12, 12, 24] },
    { degrees: [-2, -1, 0], durations: [12, 12, 24] },
    { degrees: [2, 0, -1, 0], durations: [12, 12, 12, 24] },
  ],
  deceptive: [
    { degrees: [4, 3, 2], durations: [12, 12, 24] },
    { degrees: [5, 4, 2], durations: [12, 12, 24] },
  ],
};

const TRECENTO_CADENCES: MusicStyleProfile["cadences"] = {
  ...STANDARD_CADENCES,
  closed: [
    ...STANDARD_CADENCES.closed,
    { degrees: [4, 6, 5, 7], durations: [12, 12, 12, 24] },
    { degrees: [5, 4, 2, 0], durations: [12, 12, 12, 24] },
  ],
};

// Every formula totals 48 pulses so a cadence begins on a quarter beat in
// duple meter instead of an off-beat sixteenth.
const FORCEFUL_CADENCES: MusicStyleProfile["cadences"] = {
  open: [
    { degrees: [1, 2, 3, 4], durations: [6, 6, 12, 24] },
    { degrees: [6, 5, 4], durations: [12, 12, 24] },
  ],
  closed: [
    { degrees: [3, 2, 1, 0], durations: [6, 6, 12, 24] },
    { degrees: [-2, -1, 0], durations: [12, 12, 24] },
    { degrees: [2, 1, 0], durations: [12, 12, 24] },
  ],
  deceptive: [{ degrees: [5, 4, 3, 2], durations: [6, 6, 12, 24] }],
};

export const MUSIC_ROOTS = [
  {
    id: "hearth",
    name: "By the Hearth",
    theme: "calm",
    description: "An intimate, breathing song whose returning line leaves room for conversation.",
    historicalBasis:
      "Strophic secular monody over a quiet final-and-fifth drone, shaped for an intimate plucked-string pair.",
    mode: "dorian",
    meter: "6/8",
    tempo: { min: 68, default: 80, max: 92 },
    safeTonics: [48, 50, 53, 55],
    forms: ["strophic", "refrain-verse"],
    style: {
      melodicIntervals: SONG_INTERVALS,
      startingDegrees: [1, 2, 3, 4],
      recitingDegrees: [2, 4],
      phraseBars: [3, 4, 4, 5],
      pickupPulses: [0, 6, 12],
      rhythmCells: [[12, 12], [18, 6], [12, 6, 6], [8, 8, 8], [24]],
      cadences: STANDARD_CADENCES,
      melodyRange: [62, 76],
      degreeRange: [-2, 8],
      restChance: 0.2,
    },
    luteStyle: "renaissance-lute",
    rhythmLuteTechnique: "drone",
  },
  {
    id: "road",
    name: "The Open Road",
    theme: "adventure",
    description: "Paired traveling phrases return first unresolved, then with a confident arrival.",
    historicalBasis: "Estampie-like puncta with a shared body and independently written open and closed endings.",
    mode: "dorian",
    meter: "6/8",
    tempo: { min: 94, default: 108, max: 120 },
    safeTonics: [48, 50, 53, 55],
    forms: ["paired-puncta"],
    style: {
      melodicIntervals: DANCE_INTERVALS,
      startingDegrees: [1, 2, 4],
      recitingDegrees: [4, 5],
      phraseBars: [2, 3, 3, 4],
      pickupPulses: [0, 6],
      rhythmCells: [
        [12, 12],
        [6, 6, 12],
        [8, 8, 8],
        [12, 6, 6],
        [6, 12, 6],
      ],
      cadences: STANDARD_CADENCES,
      melodyRange: [64, 79],
      degreeRange: [-1, 9],
      restChance: 0.09,
    },
    luteStyle: "gittern",
    rhythmLuteTechnique: "chords",
  },
  {
    id: "revelry",
    name: "Common Revelry",
    theme: "joy",
    description: "A bright refrain-led dance shaped into quick, lifted lute figures.",
    historicalBasis: "A later dance hybrid pared back to modal solo melody.",
    mode: "mixolydian",
    meter: "2/4",
    tempo: { min: 108, default: 124, max: 140 },
    safeTonics: [53, 55, 57, 60],
    forms: ["refrain-verse", "ostinato"],
    style: {
      melodicIntervals: DANCE_INTERVALS,
      startingDegrees: [0, 2, 4],
      recitingDegrees: [2, 4],
      phraseBars: [2, 4, 4],
      pickupPulses: [0, 6],
      rhythmCells: [
        [6, 6, 6, 6],
        [12, 6, 6],
        [6, 6, 12],
        [12, 12],
        [8, 8, 8],
      ],
      cadences: STANDARD_CADENCES,
      melodyRange: [67, 81],
      degreeRange: [-1, 9],
      restChance: 0.05,
    },
    luteStyle: "gittern",
    rhythmLuteTechnique: "chords",
  },
  {
    id: "lament",
    name: "The Empty Chair",
    theme: "sadness",
    description: "A narrow, descending lament whose silences carry as much weight as its melody.",
    historicalBasis:
      "Sparse strophic monody over a low final-and-fifth drone, with deliberate silence and delayed closure.",
    mode: "aeolian",
    meter: "3/4",
    tempo: { min: 48, default: 60, max: 72 },
    safeTonics: [45, 48, 50, 52],
    forms: ["strophic"],
    style: {
      melodicIntervals: NARROW_INTERVALS,
      startingDegrees: [3, 4, 5],
      recitingDegrees: [2, 4],
      phraseBars: [3, 4, 5, 6],
      pickupPulses: [0, 12],
      rhythmCells: [[24], [18, 6], [12, 12], [24, 12, 12], [36, 12]],
      cadences: STANDARD_CADENCES,
      melodyRange: [57, 72],
      degreeRange: [-1, 7],
      restChance: 0.34,
    },
    luteStyle: "oud",
    rhythmLuteTechnique: "drone",
  },
  {
    id: "shadows",
    name: "Whispers Below",
    theme: "dark mystery",
    description: "An unsettled modal line emerges from low notes and disappears into silence.",
    historicalBasis: "Phrygian monody with isolated ornaments and dark, low-register arrivals.",
    mode: "phrygian",
    meter: "6/8",
    tempo: { min: 56, default: 68, max: 80 },
    safeTonics: [47, 50, 52, 54],
    forms: ["through-composed", "strophic"],
    style: {
      melodicIntervals: NARROW_INTERVALS,
      startingDegrees: [1, 3, 4],
      // Phrygian recites on the sixth above the final, not the fifth: modal
      // theory moved its tenor off the unstable, tritone-adjacent fifth.
      recitingDegrees: [1, 5],
      phraseBars: [3, 4, 5],
      pickupPulses: [0, 12, 18],
      rhythmCells: [[24], [18, 6], [12, 12], [8, 8, 8], [24, 24]],
      cadences: STANDARD_CADENCES,
      melodyRange: [62, 75],
      degreeRange: [-1, 7],
      restChance: 0.36,
    },
    luteStyle: "oud",
    rhythmLuteTechnique: "chords",
  },
  {
    id: "brawl",
    name: "Benches Overturned",
    theme: "fight",
    description: "Short, forceful lute figures collide in a hard phrase-driven rush.",
    historicalBasis: "Compact late-medieval modal dance figures played as an aggressive solo line.",
    mode: "dorian",
    meter: "2/4",
    tempo: { min: 132, default: 150, max: 168 },
    safeTonics: [48, 50, 53, 55],
    forms: ["ostinato", "paired-puncta"],
    style: {
      melodicIntervals: SONG_INTERVALS,
      startingDegrees: [0, 1, 2],
      recitingDegrees: [3, 4],
      phraseBars: [2, 2, 3, 4],
      pickupPulses: [0, 6],
      rhythmCells: [
        [6, 6, 6, 6],
        [12, 6, 6],
        [6, 12, 6],
        [8, 8, 8],
      ],
      cadences: FORCEFUL_CADENCES,
      melodyRange: [62, 79],
      degreeRange: [-1, 8],
      restChance: 0.025,
    },
    luteStyle: "gittern",
    rhythmLuteTechnique: "chords",
  },
  {
    id: "courtly",
    name: "At the High Window",
    theme: "courtly longing",
    description: "A poised, yearning lute line bends patiently toward its final.",
    historicalBasis:
      "Troubadour- and trouvère-inspired strophic monody over a final-and-fifth drone, with flexible pickups and long arches.",
    mode: "dorian",
    meter: "3/4",
    tempo: { min: 62, default: 76, max: 92 },
    safeTonics: [48, 50, 53, 55],
    forms: ["strophic", "through-composed"],
    style: {
      melodicIntervals: SONG_INTERVALS,
      startingDegrees: [2, 3, 4, 5],
      recitingDegrees: [2, 4],
      phraseBars: [4, 4, 5, 6],
      pickupPulses: [0, 6, 12, 18],
      rhythmCells: [[12, 12], [18, 6], [8, 8, 8], [24], [12, 24, 12]],
      cadences: STANDARD_CADENCES,
      melodyRange: [60, 76],
      degreeRange: [-2, 8],
      restChance: 0.18,
    },
    luteStyle: "renaissance-lute",
    rhythmLuteTechnique: "drone",
  },
  {
    id: "pilgrimage",
    name: "Pilgrims at Dawn",
    theme: "resolve and ceremony",
    description: "A ceremonial refrain advances in measured, unaccompanied steps.",
    historicalBasis: "A refrain-and-verse processional informed by medieval devotional song without quoting it.",
    mode: "mixolydian",
    meter: "6/8",
    tempo: { min: 76, default: 92, max: 108 },
    safeTonics: [48, 50, 53, 55],
    forms: ["refrain-verse", "strophic"],
    style: {
      melodicIntervals: SONG_INTERVALS,
      startingDegrees: [0, 2, 4],
      recitingDegrees: [4, 5],
      phraseBars: [3, 4, 5],
      pickupPulses: [0, 6, 12],
      rhythmCells: [
        [12, 12],
        [8, 8, 8],
        [6, 6, 12],
        [16, 8],
        [12, 6, 6],
      ],
      cadences: STANDARD_CADENCES,
      melodyRange: [62, 77],
      degreeRange: [-1, 8],
      restChance: 0.1,
    },
    luteStyle: "oud",
    rhythmLuteTechnique: "chords",
  },
  {
    id: "guildhall",
    name: "Spring in the Guildhall",
    theme: "civic grace",
    description: "Bright figures trade places within a single line before a clear, ringing cadence.",
    historicalBasis: "Trecento ballata phrase shapes and formulaic cadences recast as solo melody.",
    mode: "mixolydian",
    meter: "3/4",
    tempo: { min: 78, default: 96, max: 112 },
    safeTonics: [50, 53, 55, 57],
    forms: ["ballata"],
    style: {
      melodicIntervals: SONG_INTERVALS,
      startingDegrees: [1, 2, 4, 5],
      recitingDegrees: [2, 4, 5],
      phraseBars: [3, 4, 4, 5],
      pickupPulses: [0, 6, 12],
      rhythmCells: [
        [6, 6, 12],
        [8, 8, 8],
        [12, 12],
        [4, 8, 12],
        [12, 6, 6],
        [18, 6],
      ],
      cadences: TRECENTO_CADENCES,
      melodyRange: [64, 81],
      degreeRange: [-1, 9],
      restChance: 0.08,
    },
    luteStyle: "renaissance-lute",
    rhythmLuteTechnique: "chords",
  },
] as const satisfies readonly MusicRoot[];

export type MusicRootId = (typeof MUSIC_ROOTS)[number]["id"];

export function getMusicRoot(id: MusicRootId): MusicRoot {
  const root = MUSIC_ROOTS.find((candidate) => candidate.id === id);
  if (!root) throw new Error(`Unknown music root: ${id}`);
  return root;
}
