import { IconHeart, IconPlayerPlay } from "@tabler/icons-react";
import { startFavoritesPlayback } from "@/audio/playback/favorites";
import { luteSummary } from "@/audio/composition/lineup";
import { MAX_MUSIC_FAVORITES, toggleMusicFavorite, type MusicLibraryTrack } from "@/audio/musicLibrary";
import { MUSIC_FORM_LABELS } from "@/audio/composition/roots";
import { Button } from "@/components/ui/button";
import { notify } from "@/app/notifications/store";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { MusicCoverArt } from "../MusicCoverArt";
import { durationLabel } from "../format";
import { MusicTrackDownload } from "./MusicTrackDownload";
import type { MusicLibraryTab } from "./types";

interface MusicTrackRowProps {
  entry: MusicLibraryTrack;
  tab: MusicLibraryTab;
  favorite: boolean;
}

/** One saved take: its cover, what it is, and what can be done with it. */
export function MusicTrackRow({ entry, tab, favorite }: MusicTrackRowProps) {
  // Everything a row shows comes from the take's cheap description and its
  // pre-resolved lineup; reading `entry.piece` here would compose every take
  // in the shelf just to render the list. The lineup already reflects the
  // take's own render options, including whether its lute was muted.
  const instrument = luteSummary(entry.lineup);

  // ItemGroup announces role=list, so each row must be its listitem.
  return (
    <Item role="listitem" variant="outline" size="sm">
      <ItemMedia>
        <MusicCoverArt subject={entry.description} size={40} label={`Cover of ${entry.name}`} />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="max-w-full truncate">{entry.name}</ItemTitle>
        <ItemDescription className="line-clamp-1 text-2xs">
          {entry.rootName} · {entry.theme} · {MUSIC_FORM_LABELS[entry.description.form]} · {entry.description.bpm} BPM ·{" "}
          {durationLabel(entry.description.durationSeconds)}
        </ItemDescription>
        <ItemDescription className="line-clamp-1 text-2xs text-muted-foreground/80">{instrument}</ItemDescription>
      </ItemContent>
      <ItemActions className="ml-auto gap-0.5">
        {tab === "favorites" && (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Play ${entry.name}`}
            onClick={() => startFavoritesPlayback(entry.id)}
          >
            <IconPlayerPlay />
          </Button>
        )}
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`${favorite ? "Remove" : "Add"} ${entry.name} ${favorite ? "from" : "to"} favourites`}
          aria-pressed={favorite}
          className={favorite ? "text-primary" : undefined}
          onClick={() => {
            const result = toggleMusicFavorite(entry);
            if (result === "library-full") {
              notify("error", `Favourites are full (${MAX_MUSIC_FAVORITES}). Remove one to keep ${entry.name}.`);
            } else {
              notify(
                "success",
                result === "added" ? `${entry.name} added to Favourites` : `${entry.name} removed from Favourites`,
              );
            }
          }}
        >
          <IconHeart className={favorite ? "fill-current" : undefined} />
        </Button>
        <MusicTrackDownload entry={entry} />
      </ItemActions>
    </Item>
  );
}
