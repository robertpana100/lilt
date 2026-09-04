import { setMusicSystemMediaControls } from "@/audio/musicSettings";
import { Switch } from "@/components/ui/switch";
export function SystemMediaToggle({ enabled }: { enabled: boolean }) {
  return (
    <div className="system-media-toggle">
      <span>Media keys</span>
      <Switch
        aria-label="Show music in system controls"
        checked={enabled}
        onCheckedChange={setMusicSystemMediaControls}
      />
    </div>
  );
}
