import type { MusicLibraryTrack } from "@/audio/musicLibrary";
import { ItemGroup } from "@/components/ui/item";
import { MusicTrackRow } from "./MusicTrackRow";
import type { MusicLibraryShelf } from "./types";

interface MusicTrackListProps {
  tracks: readonly MusicLibraryTrack[];
  shelf: MusicLibraryShelf;
  favoriteIds: ReadonlySet<string>;
}

/** Keeps large collections independently scrollable. */
export function MusicTrackList({ tracks, shelf, favoriteIds }: MusicTrackListProps) {
  return (
    <div data-music-library-scroll-panel className="max-h-72 overflow-y-auto overscroll-contain pr-1">
      <ItemGroup className="gap-2">
        {tracks.map((entry) => (
          <MusicTrackRow
            key={"playId" in entry ? String(entry.playId) : entry.id}
            entry={entry}
            shelf={shelf}
            favorite={favoriteIds.has(entry.id)}
          />
        ))}
      </ItemGroup>
    </div>
  );
}
