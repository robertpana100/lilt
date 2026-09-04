import type { MusicLibraryTrack } from "@/audio/musicLibrary";
import { ItemGroup } from "@/components/ui/item";
import { MusicTrackRow } from "./MusicTrackRow";
import type { MusicLibraryTab } from "./types";

interface MusicTrackListProps {
  tracks: readonly MusicLibraryTrack[];
  tab: MusicLibraryTab;
  favoriteIds: ReadonlySet<string>;
}

/**
 * The shelf itself, scrolling within its own height.
 *
 * A hundred favourites laid out in full turn the studio into a page that is
 * mostly library, with the player scrolled far out of reach. The list keeps to
 * about four rows and scrolls inside them, so the three cards stay one screen
 * however much Lilt has played.
 */
export function MusicTrackList({ tracks, tab, favoriteIds }: MusicTrackListProps) {
  return (
    <div data-music-library-scroll-panel className="max-h-72 overflow-y-auto overscroll-contain pr-1">
      <ItemGroup className="gap-2">
        {tracks.map((entry) => (
          <MusicTrackRow
            key={"playId" in entry ? String(entry.playId) : entry.id}
            entry={entry}
            tab={tab}
            favorite={favoriteIds.has(entry.id)}
          />
        ))}
      </ItemGroup>
    </div>
  );
}
