import { setMusicControlMode, type MusicSettings } from "@/audio/musicSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MUSIC_DIRECTION_ITEMS = {
  auto: "Automatic",
  override: "Manual",
} as const;

interface MusicDirectionControlsProps {
  settings: MusicSettings;
}

/** Who chooses what plays next: Lilt or the player. */
export function MusicDirectionControls({ settings }: MusicDirectionControlsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">Direction</p>
      <Select
        items={MUSIC_DIRECTION_ITEMS}
        value={settings.controlMode}
        onValueChange={(value) => {
          if (value === "auto" || value === "override") setMusicControlMode(value);
        }}
      >
        <SelectTrigger aria-label="Music direction" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Automatic</SelectItem>
          <SelectItem value="override">Manual</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
