import { setMusicSystemMediaControls } from "@/audio/musicSettings";
import { Switch } from "@/components/ui/switch";

/** Whether the score is published to the machine's own now-playing panel. */
export function SystemMediaToggle({ enabled }: { enabled: boolean }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2">
      <div>
        <p className="text-xs font-medium">Show in system controls</p>
        <p className="text-2xs text-muted-foreground">
          Name the song and show its cover where your computer lists what is playing, and answer the media keys.
        </p>
      </div>
      <Switch
        aria-label="Show music in system controls"
        checked={enabled}
        onCheckedChange={setMusicSystemMediaControls}
      />
    </div>
  );
}
