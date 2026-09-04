import { useEffect, useMemo, useState } from "react";
import { IconArrowsShuffle, IconListNumbers, IconSearch, IconX } from "@tabler/icons-react";
import { setFavoritePlaybackOrder } from "@/audio/playback/favorites";
import { searchMusicTracks, useMusicLibrary, type MusicLibraryTrack } from "@/audio/musicLibrary";
import { useMusicSettings } from "@/audio/musicSettings";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { notify } from "@/app/notifications/store";
import { MusicLibraryEmpty } from "./MusicLibraryEmpty";
import { MusicTrackList } from "./MusicTrackList";
import type { MusicLibraryTab } from "./types";

const SHELVES: readonly MusicLibraryTab[] = ["recent", "favorites"];

export function MusicLibrarySection() {
  const library = useMusicLibrary();
  const settings = useMusicSettings();
  const [tab, setTab] = useState<MusicLibraryTab>("recent");
  const [query, setQuery] = useState("");
  const favoriteIds = useMemo(() => new Set(library.favorites.map((entry) => entry.id)), [library.favorites]);
  const tracks: readonly MusicLibraryTrack[] = tab === "favorites" ? library.favorites : library.recent;
  const filteredTracks = searchMusicTracks(tracks, query);

  useEffect(() => {
    if (library.persistenceError) notify("error", library.persistenceError);
  }, [library.persistenceError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Music library</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
        <Tabs value={tab} onValueChange={(value) => setTab(value as MusicLibraryTab)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList className="min-w-56 flex-1 sm:flex-none">
              <TabsTrigger value="recent">
                Recent <Badge variant="secondary">{library.recent.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="favorites">
                Favourites <Badge variant="secondary">{library.favorites.length}</Badge>
              </TabsTrigger>
            </TabsList>
            {tab === "favorites" && library.favorites.length > 0 && (
              <ToggleGroup
                aria-label="Favourites playback order"
                variant="outline"
                size="sm"
                spacing={0}
                value={[settings.favoritesOrder]}
                onValueChange={(value) => {
                  const order = value[0];
                  if (order === "shuffle" || order === "ordered") {
                    setFavoritePlaybackOrder(order);
                  }
                }}
              >
                <ToggleGroupItem value="shuffle" aria-label="Shuffle favourites">
                  <IconArrowsShuffle />
                  Shuffle
                </ToggleGroupItem>
                <ToggleGroupItem value="ordered" aria-label="Play favourites in order">
                  <IconListNumbers />
                  Ordered
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
          {SHELVES.map((shelf) => (
            <TabsContent key={shelf} value={shelf}>
              {tab === shelf &&
                (filteredTracks.length > 0 ? (
                  <MusicTrackList tracks={filteredTracks} tab={shelf} favoriteIds={favoriteIds} />
                ) : (
                  <MusicLibraryEmpty tab={shelf} searching={query.trim().length > 0} />
                ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
