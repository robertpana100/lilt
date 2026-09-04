import { getMusicApplication } from "@/audio/application";
import { notify } from "@/app/notifications/store";
import { useMusicRuntime, useMusicSessionController } from "@/audio/playback/react";
import { setMusicEnabled, setMusicVolume } from "@/audio/musicSettings";

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
      <div className="playback-controls">
        <button
          type="button"
          className="primary-button"
          aria-label={playing ? "Pause music" : "Play music"}
          onClick={() => void togglePlayback()}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <label className="volume-control">
          Volume
          <input
            aria-label="Music volume"
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume * 100}
            onChange={(event) => setMusicVolume(event.currentTarget.valueAsNumber / 100)}
          />
        </label>
      </div>
      <div className="composition-actions">
        <button
          type="button"
          aria-label="Randomize song"
          title="Generate a fresh song in a different atmosphere. Reset tempo and clear form and key locks."
          onClick={() => controller.randomize()}
        >
          Randomize
          <small>New atmosphere</small>
        </button>
        <button
          type="button"
          aria-label="New composition"
          title="Generate a fresh song with the same atmosphere, tempo, and form and key settings."
          onClick={() => controller.newComposition()}
        >
          New composition
          <small>Keep settings</small>
        </button>
      </div>
    </div>
  );
}
