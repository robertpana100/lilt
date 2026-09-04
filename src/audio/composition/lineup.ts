import type { MusicPiece } from "./types";
import { getMusicRoot, type LuteStyleId, type LuteTechnique, type MusicPart, type MusicRootId } from "./roots";

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

function musicPartsLineup(
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
