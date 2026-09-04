import { IconMusicOff, IconSearch } from "@tabler/icons-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { MusicLibraryTab } from "./types";

interface MusicLibraryEmptyProps {
  tab: MusicLibraryTab;
  searching: boolean;
}

export function MusicLibraryEmpty({ tab, searching }: MusicLibraryEmptyProps) {
  return (
    <Empty className="min-h-36 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">{searching ? <IconSearch /> : <IconMusicOff />}</EmptyMedia>
        <EmptyTitle>
          {searching ? "No matching songs" : tab === "favorites" ? "No favourites yet" : "No songs played yet"}
        </EmptyTitle>
        <EmptyDescription>
          {searching
            ? "Try a title, atmosphere, form, or tempo."
            : tab === "favorites"
              ? "Mark a recent song with the heart to preserve it here."
              : "Songs appear here when audible playback begins."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
