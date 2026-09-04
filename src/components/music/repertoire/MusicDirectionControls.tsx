import { setMusicDirection } from "@/audio/playback/favorites";
import type { MusicSettings } from "@/audio/musicSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MUSIC_DIRECTION_ITEMS = {
  auto: "Automatic",
  override: "Manual",
  favorites: "Favourites",
} as const;

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
          <SelectItem value="auto">Automatic</SelectItem>
          <SelectItem value="override">Manual</SelectItem>
          <SelectItem value="favorites" disabled={favoriteCount === 0}>
            Favourites
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
