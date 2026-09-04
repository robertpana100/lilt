import { getMusicRoot, type MusicRootId } from "./composition/roots";

const MUSIC_ARTIST = "Lilt";

export interface MusicTrackMetadata {
  /** The generated name of this take. */
  title: string;
  /** Product credit shared by files and operating-system media surfaces. */
  artist: string;
  /** The compositional root this take belongs to. */
  album: string;
  /** The root's authored mood. */
  genre: string;
  /** Written length, excluding the gap after the piece. */
  durationSeconds: number;
}

export interface MusicTrackMetadataSource {
  name: string;
  rootId: MusicRootId;
  durationSeconds: number;
}

/**
 * Describes a generated take once for every surface that names it.
 *
 * Operating-system media controls and downloaded files should not disagree
 * about the artist credit or which collection a take belongs to.
 */
export function musicTrackMetadata(source: MusicTrackMetadataSource): MusicTrackMetadata {
  const root = getMusicRoot(source.rootId);
  return {
    title: source.name,
    artist: MUSIC_ARTIST,
    album: root.name,
    genre: root.theme,
    durationSeconds: source.durationSeconds,
  };
}
