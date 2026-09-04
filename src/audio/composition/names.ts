import { mixMusicSeed, type MusicPiece } from "./generator";
import { getMusicRoot, type MusicRootId } from "./roots";

interface MusicNameLexicon {
  subjects: readonly string[];
  places: readonly string[];
  keepers: readonly string[];
}

const THEME_LEXICONS: Record<MusicRootId, MusicNameLexicon> = {
  hearth: {
    subjects: ["Ember", "Hearth", "Oak", "Candle", "Fireside", "Kettle", "Chimney", "Homecoming"],
    places: ["the Fireside", "the Old Oak", "the Warm Hall", "the Last Candle", "the Chimney Corner"],
    keepers: ["Hearthkeeper", "Innkeeper", "Goodwife", "Storyteller", "Old Host"],
  },
  road: {
    subjects: ["Wayfarer", "Milestone", "Horizon", "Wayside", "Pilgrim", "Crossroad", "Dust", "Far Country"],
    places: ["the Crossroads", "the North Road", "the Far Mile", "the Wayside", "the Open Gate"],
    keepers: ["Wayfarer", "Peddler", "Pilgrim", "Roadwarden", "Carter"],
  },
  revelry: {
    subjects: ["Tankard", "Garland", "Midsummer", "Lantern", "Maypole", "Cask", "Mummer", "Bonfire"],
    places: ["the Lantern Fair", "the Maypole", "the Long Table", "the Midsummer Green", "the Open Cask"],
    keepers: ["Mummer", "Cupbearer", "Dancer", "Brewer", "Fiddler"],
  },
  lament: {
    subjects: ["Ash", "Farewell", "Willow", "Empty Chair", "Rainfall", "Black Ribbon", "Last Letter", "Widow's Lamp"],
    places: ["the Willow", "the Empty House", "the Rain", "the Churchyard", "the Quiet Door"],
    keepers: ["Widow", "Mourner", "Bellringer", "Exile", "Watchman"],
  },
  shadows: {
    subjects: ["Hollow", "Moon", "Undercrypt", "Whisper", "Veil", "Raven", "Keyhole", "Unlit Stair"],
    places: ["the Undercrypt", "the Moonless Court", "the Sealed Door", "the Hollow", "the Unlit Stair"],
    keepers: ["Gravedigger", "Night Watch", "Raven Keeper", "Crypt Warden", "Veiled Stranger"],
  },
  brawl: {
    subjects: ["Iron", "Broken Bench", "Red Knuckle", "Rattle", "Alehouse", "Gauntlet", "War Cry", "Splintered Oak"],
    places: ["the Alehouse", "the Broken Bench", "the South Gate", "the Fighting Pit", "the Red Yard"],
    keepers: ["Brawler", "Blacksmith", "Gate Guard", "Pit Champion", "Rowdy Miller"],
  },
  courtly: {
    subjects: ["Laurel", "Rose", "Gallery", "Silk", "Vigil", "Falcon", "Ivory Glove", "Painted Chamber"],
    places: ["the Painted Gallery", "the Rose Court", "the High Chamber", "the Laurel Walk", "the Falconer's Lawn"],
    keepers: ["Chamberlain", "Rose Knight", "Lady's Falconer", "Court Poet", "Young Regent"],
  },
  pilgrimage: {
    subjects: ["Dawn", "Pilgrim", "Wayside Bell", "Procession", "Reliquary", "Candle Road", "Shrine", "Sandaled Step"],
    places: ["the Wayside Shrine", "the Eastern Road", "the Abbey Bell", "the Pilgrim Gate", "the Candle Road"],
    keepers: ["Pilgrim", "Abbess", "Shrine Keeper", "Bell Brother", "Barefoot Guide"],
  },
  guildhall: {
    subjects: ["Guild Seal", "Fountain", "Spring", "Mercer", "Courtyard", "Ledger", "Silver Key", "Market Bell"],
    places: ["the Guildhall", "the Market Fountain", "the Mercer Court", "the Counting Room", "the Silver Gate"],
    keepers: ["Guildmaster", "Mercer", "Apprentice", "Factor", "Market Warden"],
  },
};

const SLOW_WORDS = ["Lingering", "Quiet", "Distant", "Fading", "Patient", "Hushed", "Twilit", "Unhurried"] as const;
const MID_WORDS = [
  "Wandering",
  "Steady",
  "Turning",
  "Kindled",
  "Restless",
  "Returning",
  "Weathered",
  "Wayward",
] as const;
const FAST_WORDS = ["Racing", "Fierce", "Flying", "Reeling", "Quickened", "Rattling", "Leaping", "Headlong"] as const;
const MOMENTS = ["Dawn", "Vespers", "Nightfall", "First Light", "the Long Evening", "the Small Hours"] as const;
const FORM_WORDS = {
  strophic: ["Ballad", "Lay", "Song", "Verse"],
  "paired-puncta": ["Estampie", "Dance", "Way", "Puncta"],
  "refrain-verse": ["Cantiga", "Round", "Song", "Refrain"],
  ballata: ["Ballata", "Madrigal", "Song", "Air"],
  ostinato: ["Dance", "Ground", "Round", "Measure"],
  "through-composed": ["Tale", "Dream", "Air", "Journey"],
} as const;

function pick<T>(values: readonly T[], seed: number): T {
  const selected = values[seed % values.length];
  if (selected === undefined) throw new Error("Cannot name music from an empty lexicon.");
  return selected;
}

/** A deterministic title derived from the composition's mood, tempo, form, and independent seeded word streams. */
export function nameMusicPiece(piece: MusicPiece): string {
  const root = getMusicRoot(piece.rootId);
  const tempoPosition = (piece.bpm - root.tempo.min) / Math.max(1, root.tempo.max - root.tempo.min);
  const tempoWords = tempoPosition < 0.34 ? SLOW_WORDS : tempoPosition > 0.66 ? FAST_WORDS : MID_WORDS;
  const seed = mixMusicSeed(piece.compositionSeed, piece.variationSeed, piece.pieceIndex, piece.bpm);
  const lexicon = THEME_LEXICONS[piece.rootId];
  const tempo = pick(tempoWords, mixMusicSeed(seed, 0x54454d50));
  const subject = pick(lexicon.subjects, mixMusicSeed(seed, 0x5355424a));
  const place = pick(lexicon.places, mixMusicSeed(seed, 0x504c4143));
  const keeper = pick(lexicon.keepers, mixMusicSeed(seed, 0x4b454550));
  const form = pick(FORM_WORDS[piece.form], mixMusicSeed(seed, 0x464f524d));
  const moment = pick(MOMENTS, mixMusicSeed(seed, 0x4d4f4d45));
  switch (mixMusicSeed(seed, 0x53545255) % 6) {
    case 0:
      return `${tempo} ${subject} ${form}`;
    case 1:
      return `The ${form} of the ${subject}`;
    case 2:
      return `${subject} at ${place}`;
    case 3:
      return `${keeper}’s ${form}`;
    case 4:
      return `The ${tempo} ${subject}`;
    default:
      return `${subject}, ${form} at ${moment}`;
  }
}
