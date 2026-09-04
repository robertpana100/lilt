import { createMusicRandom, mixMusicSeed, pickMusicValue } from "../composition/random";
import {
  MUSIC_ROOTS,
  getMusicRoot,
  type MusicMeter,
  type MusicPieceForm,
  type MusicRootId,
} from "../composition/roots";
export interface CoverArtColors {
  background: string;
  foreground: string;
}

/**
 * The centre of a rose window. One device per semantic form, so a ballata and an
 * ostinato are recognisably different objects rather than two random pictures.
 */
export type CoverArtDevice = "cross" | "quatrefoil" | "star" | "bars" | "lozenge" | "spiral";

/** How the band between the two rings is treated, one signature per root. */
export type CoverArtBand = "plain" | "spoked" | "studded";

/**
 * Everything about a take that its cover is drawn from, and nothing else.
 *
 * The runtime snapshot supplies the same subject to the studio and system
 * media artwork, so both surfaces draw the same cover.
 */
export interface CoverArtSubject {
  rootId: MusicRootId;
  form: MusicPieceForm;
  tonicMidi: number;
  compositionSeed: number;
  variationSeed: number;
}

/**
 * A cover as a description rather than as pixels: everything a renderer needs,
 * and nothing about how it is drawn.
 */
export interface CoverArtDesign {
  field: string;
  ink: string;
  /** How many petals the rose is divided into, and how many spokes its band has. */
  symmetry: number;
  device: CoverArtDevice;
  band: CoverArtBand;
  rotationDegrees: number;
  /** Ring thickness as a fraction of the tile, before the renderer scales it. */
  ringWeight: number;
  /** Identity of this design, for deciding whether it needs drawing again. */
  key: string;
}

const DEVICES: Readonly<Record<MusicPieceForm, CoverArtDevice>> = {
  strophic: "cross",
  "paired-puncta": "lozenge",
  "refrain-verse": "quatrefoil",
  ballata: "star",
  ostinato: "bars",
  "through-composed": "spiral",
};

/**
 * A rose is divided the way the music is counted. Four, six, and eight are as
 * far as it goes: a twelve-part rose is lace, and lace is mud once the operating
 * system has scaled the tile down to forty pixels.
 */
const SYMMETRY: Readonly<Record<MusicMeter, number>> = {
  "2/4": 4,
  "3/4": 6,
  "6/8": 8,
};

const BANDS: readonly CoverArtBand[] = ["plain", "spoked", "studded"];
const RING_WEIGHTS = [0.028, 0.034, 0.042] as const;

/**
 * The cover of one take.
 *
 * Every choice comes from the piece itself, so a cover is as deterministic as
 * the score: the metre divides the rose, the form chooses the central device,
 * the tonic turns it, the root decides how its band is treated, and the
 * composition seed settles the weight of the line.
 *
 * Colour is supplied by the host, independently of the composition.
 */
export function coverArtDesign(subject: CoverArtSubject, colors: CoverArtColors): CoverArtDesign {
  const root = getMusicRoot(subject.rootId);
  const random = createMusicRandom(mixMusicSeed(subject.compositionSeed, subject.variationSeed));
  const ringWeight = pickMusicValue(RING_WEIGHTS, random);
  const symmetry = SYMMETRY[root.meter];
  const device = DEVICES[subject.form];
  // Twelve pitch classes over a full turn, so a piece in one tonic never sits
  // exactly where a piece in another does.
  const rotationDegrees = (((subject.tonicMidi % 12) + 12) % 12) * 30;
  const rootIndex = Math.max(
    0,
    MUSIC_ROOTS.findIndex((entry) => entry.id === root.id),
  );
  const band = BANDS[rootIndex % BANDS.length];
  if (!band) throw new Error("Cover-art band registry is empty.");

  return {
    field: colors.background,
    ink: colors.foreground,
    symmetry,
    device,
    band,
    rotationDegrees,
    ringWeight,
    key: [colors.background, colors.foreground, symmetry, device, band, rotationDegrees, ringWeight].join("|"),
  };
}
