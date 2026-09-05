import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import * as stylex from "@stylexjs/stylex";
import { styles } from "@/components/music/styles";
import { getMusicApplication } from "@/audio/application";
import { notify } from "@/app/notifications/store";
import { useMusicRuntime, useMusicSessionController } from "@/audio/playback/react";
import { setMusicEnabled, setMusicVolume } from "@/audio/musicSettings";
import { useId } from "react";

export function MusicTransport({ enabled, volume }: { enabled: boolean; volume: number }) {
  const volumeId = useId();
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
    <div {...stylex.props(styles.transportControls)}>
      <div {...stylex.props(styles.playbackControls)}>
        <Button
          type="button"
          variant="primary"
          aria-label={playing ? "Pause music" : "Play music"}
          onClick={() => void togglePlayback()}
        >
          {playing ? "Pause" : "Play"}
        </Button>
        <label htmlFor={volumeId} {...stylex.props(styles.volumeControl)}>
          Volume
          <Slider
            id={volumeId}
            aria-label="Music volume"
            aria-valuetext={`${Math.round(volume * 100)}%`}
            min={0}
            max={100}
            step={1}
            value={volume * 100}
            onChange={(event) => setMusicVolume(event.currentTarget.valueAsNumber / 100)}
          />
        </label>
      </div>
      <div {...stylex.props(styles.compositionActions)}>
        <Button
          type="button"
          description="New atmosphere"
          aria-label="Randomize song"
          title="Generate a fresh song in a different atmosphere. Reset tempo and clear form and key locks."
          onClick={() => controller.randomize()}
        >
          Randomize
        </Button>
        <Button
          type="button"
          description="Keep settings"
          aria-label="New composition"
          title="Generate a fresh song while keeping the current effects, atmosphere, tempo, and form and key settings."
          onClick={() => controller.newComposition()}
        >
          New composition
        </Button>
      </div>
    </div>
  );
}
