import { useEffect, useMemo, useState } from "react";
import { IconArrowsShuffle, IconListNumbers, IconSearch, IconX } from "@tabler/icons-react";
import { setFavoritePlaybackOrder } from "@/audio/playback/favorites";
import { searchMusicTracks, useMusicLibrary, type MusicLibraryTrack } from "@/audio/musicLibrary";
import { useMusicSettings } from "@/audio/musicSettings";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { notify } from "@/app/notifications/store";
import { MusicLibraryEmpty } from "./MusicLibraryEmpty";
import { MusicTrackList } from "./MusicTrackList";
import type { MusicLibraryShelf } from "./types";

const SHELVES: readonly MusicLibraryShelf[] = ["recent", "favorites"];

export function MusicLibrarySection() {
  const library = useMusicLibrary();
  const settings = useMusicSettings();
  const [query, setQuery] = useState("");
  const favoriteIds = useMemo(() => new Set(library.favorites.map((entry) => entry.id)), [library.favorites]);

  useEffect(() => {
    if (library.persistenceError) notify("error", library.persistenceError);
  }, [library.persistenceError]);

  return (
    <Card className="music-library">
      <CardHeader className="library-heading">
        <CardTitle>Library</CardTitle>
        <InputGroup>
          <InputGroupAddon>
            <IconSearch />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="Search music library"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Clear music search" onClick={() => setQuery("")}>
                <IconX />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </CardHeader>
      <CardContent className="library-shelves">
        {SHELVES.map((shelf) => {
          const tracks: readonly MusicLibraryTrack[] = shelf === "favorites" ? library.favorites : library.recent;
          const filteredTracks = searchMusicTracks(tracks, query);
          return (
            <section
              key={shelf}
              aria-label={shelf === "favorites" ? "Favourites" : "Recent tracks"}
              className="library-shelf"
            >
              <div className="shelf-heading">
                <h3>
                  {shelf === "favorites" ? "Favourites" : "Recent"} <Badge variant="secondary">{tracks.length}</Badge>
                </h3>
                {shelf === "favorites" && tracks.length > 0 && (
                  <ToggleGroup
                    aria-label="Favourites playback order"
                    variant="outline"
                    size="sm"
                    spacing={0}
                    value={[settings.favoritesOrder]}
                    onValueChange={(value) => {
                      const order = value[0];
                      if (order === "shuffle" || order === "ordered") setFavoritePlaybackOrder(order);
                    }}
                  >
                    <ToggleGroupItem value="shuffle" aria-label="Shuffle favourites" title="Shuffle favourites">
                      <IconArrowsShuffle />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="ordered"
                      aria-label="Play favourites in order"
                      title="Play favourites in order"
                    >
                      <IconListNumbers />
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}
              </div>
              {filteredTracks.length > 0 ? (
                <MusicTrackList tracks={filteredTracks} shelf={shelf} favoriteIds={favoriteIds} />
              ) : (
                <MusicLibraryEmpty shelf={shelf} searching={query.trim().length > 0} />
              )}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
