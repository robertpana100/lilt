import { setMusicDirection } from "@/audio/playback/favorites";
import type { MusicSettings } from "@/audio/musicSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MUSIC_DIRECTION_ITEMS = {
  auto: "Play everything",
  override: "Shape the music",
  favorites: "Play favourites",
} as const;

const DIRECTION_NOTES: Readonly<Record<MusicSettings["controlMode"], string>> = {
  auto: "The whole repertoire plays; every new piece moves to another theme.",
  override: "Theme and composition stay as you set them until you hand direction back.",
  favorites: "Saved favourites direct the repertoire; composition stays locked.",
};

interface MusicDirectionControlsProps {
  settings: MusicSettings;
  favoriteCount: number;
}

/** Who chooses what plays next: Lilt, the player, or the favourites list. */
export function MusicDirectionControls({ settings, favoriteCount }: MusicDirectionControlsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">Direction</p>
      <Select
        items={MUSIC_DIRECTION_ITEMS}
        value={settings.controlMode}
        onValueChange={(value) => {
          if (value) setMusicDirection(value as MusicSettings["controlMode"]);
        }}
      >
        <SelectTrigger aria-label="Music direction" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Play everything</SelectItem>
          <SelectItem value="override">Shape the music</SelectItem>
          <SelectItem value="favorites" disabled={favoriteCount === 0}>
            Play favourites
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-2xs text-muted-foreground">{DIRECTION_NOTES[settings.controlMode]}</p>
    </div>
  );
}
