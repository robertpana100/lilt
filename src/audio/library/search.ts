import { MUSIC_FORM_LABELS } from "../composition/roots";
import type { MusicLibraryTrack } from "./types";

function normalizedSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function searchMusicTracks<T extends MusicLibraryTrack>(tracks: readonly T[], query: string): readonly T[] {
  const tokens = normalizedSearch(query).trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return tracks;
  // Haystacks read the cheap description, never `track.piece`: a keystroke
  // over a hundred saved takes must not compose a hundred scores.
  return tracks.filter((track) => {
    const document = normalizedSearch(
      [
        track.name,
        track.rootName,
        track.theme,
        track.description.form,
        MUSIC_FORM_LABELS[track.description.form],
        `${track.description.bpm}`,
        `${track.description.bpm} bpm`,
      ].join(" "),
    );
    return tokens.every((token) => document.includes(token));
  });
}
