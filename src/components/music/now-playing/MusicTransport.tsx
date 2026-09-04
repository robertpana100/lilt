import { getMusicApplication } from "@/audio/application";
import { notify } from "@/app/notifications/store";
import { IconPlayerPause, IconPlayerPlay, IconPlayerTrackNext } from "@tabler/icons-react";
import { useMusicRuntime, useMusicSessionController } from "@/audio/playback/react";
import { setMusicEnabled, setMusicVolume } from "@/audio/musicSettings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider, sliderValue } from "@/components/ui/slider";

/**
 * The three things a player does to a score that decides itself: stop it, move
 * it on, and set how loud it sits under Lilt.
 */
export function MusicTransport({ enabled, volume }: { enabled: boolean; volume: number }) {
  const controller = useMusicSessionController();
  const runtime = useMusicRuntime();
  const playing = enabled && (runtime.status === "playing" || runtime.status === "gap");
  const togglePlayback = async () => {
    if (playing) {
      setMusicEnabled(false);
      return;
    }
    setMusicEnabled(true);
    try {
      if (!(await getMusicApplication().unlock())) notify("error", "Audio could not start. Press Play to try again.");
    } catch {
      notify("error", "Audio could not start. Press Play to try again.");
    }
  };
  return (
    <div className="grid items-center gap-3 sm:grid-cols-[auto_1fr]">
      <div className="flex gap-1.5">
        <Button variant="default" className="sm:min-w-32" onClick={() => void togglePlayback()}>
          {playing ? <IconPlayerPause /> : <IconPlayerPlay />}
          {playing ? "Pause music" : "Play music"}
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-label="Next song"
          title="Next song"
          disabled={!enabled}
          onClick={() => controller.skipToNextPiece()}
        >
          <IconPlayerTrackNext />
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <Label>Music volume</Label>
          <Badge variant="outline">{Math.round(volume * 100)}%</Badge>
        </div>
        <Slider
          aria-label="Music volume"
          min={0}
          max={100}
          step={1}
          value={[volume * 100]}
          onValueChange={(value) => setMusicVolume(sliderValue(value) / 100)}
        />
      </div>
    </div>
  );
}
