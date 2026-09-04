import { getMusicApplication } from "@/audio/application";
import { notify } from "@/app/notifications/store";
import { IconPlayerPause, IconPlayerPlay, IconPlayerTrackNext, IconVolume } from "@tabler/icons-react";
import { useMusicRuntime, useMusicSessionController } from "@/audio/playback/react";
import { setMusicEnabled, setMusicVolume } from "@/audio/musicSettings";
import { Button } from "@/components/ui/button";
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
    <div className="transport-controls">
      <div className="transport-buttons">
        <Button
          variant="default"
          size="icon-lg"
          aria-label={playing ? "Pause music" : "Play music"}
          title={playing ? "Pause" : "Play"}
          onClick={() => void togglePlayback()}
        >
          {playing ? <IconPlayerPause /> : <IconPlayerPlay />}
        </Button>
        <Button
          size="icon-lg"
          variant="ghost"
          aria-label="Next song"
          title="Next song"
          disabled={!enabled}
          onClick={() => controller.skipToNextPiece()}
        >
          <IconPlayerTrackNext />
        </Button>
      </div>
      <div className="volume-control">
        <IconVolume aria-hidden="true" />
        <Slider
          aria-label="Music volume"
          min={0}
          max={100}
          step={1}
          value={[volume * 100]}
          onValueChange={(value) => setMusicVolume(sliderValue(value) / 100)}
        />
        <span>{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
}
