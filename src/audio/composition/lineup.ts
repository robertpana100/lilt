import type { MusicPiece } from "./types";
import {
  getLuteStyle,
  getMusicRoot,
  type LuteStyleId,
  type LuteTechnique,
  type MusicPart,
  type MusicRootId,
} from "./roots";

export const LUTE_TECHNIQUE_NAMES: Readonly<Record<LuteTechnique, string>> = {
  melody: "Melody course",
  rhythm: "Chord strum",
  drone: "Drone course",
};

export interface MusicLuteLineupEntry {
  part: MusicPart;
  technique: LuteTechnique;
  style: LuteStyleId;
}

export function musicPartsLineup(
  rootId: MusicRootId,
  soundingParts: readonly MusicPart[],
  mutedParts: Readonly<Record<MusicPart, boolean>>,
): MusicLuteLineupEntry[] {
  const root = getMusicRoot(rootId);
  const style = root.luteStyle;
  const entries: MusicLuteLineupEntry[] = [];
  if (soundingParts.includes("strings") && !mutedParts.strings) {
    entries.push({ part: "strings", technique: "melody", style });
  }
  if (soundingParts.includes("rhythm") && !mutedParts.rhythm) {
    entries.push({ part: "rhythm", technique: root.rhythmLuteTechnique === "drone" ? "drone" : "rhythm", style });
  }
  return entries;
}

export function musicPieceLineup(
  piece: MusicPiece,
  mutedParts: Readonly<Record<MusicPart, boolean>>,
): MusicLuteLineupEntry[] {
  return musicPartsLineup(
    piece.rootId,
    piece.events.map((event) => event.part),
    mutedParts,
  );
}

/** One compact physical-instrument label for library rows. */
export function luteSummary(lineup: readonly MusicLuteLineupEntry[]): string {
  if (lineup.length === 0) return "Muted lute";
  const [first] = lineup;
  if (!first) return "Muted lute";
  const name = getLuteStyle(first.style).name;
  return lineup.some((entry) => entry.part === "rhythm") && lineup.some((entry) => entry.part !== "rhythm")
    ? `${name} duo`
    : name;
}
