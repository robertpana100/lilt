import { IconMusicOff, IconSearch } from "@tabler/icons-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { MusicLibraryShelf } from "./types";

interface MusicLibraryEmptyProps {
  shelf: MusicLibraryShelf;
  searching: boolean;
}

export function MusicLibraryEmpty({ shelf, searching }: MusicLibraryEmptyProps) {
  return (
    <Empty className="min-h-36 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">{searching ? <IconSearch /> : <IconMusicOff />}</EmptyMedia>
        <EmptyTitle>
          {searching ? "No matching songs" : shelf === "favorites" ? "No favourites" : "No recent tracks"}
        </EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}
