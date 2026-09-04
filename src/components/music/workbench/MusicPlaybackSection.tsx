import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider, sliderValue } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { setMusicEnabled, setMusicVolume, useMusicSettings } from "@/audio/musicSettings";
import { useMusicPosition, useMusicRuntime, useMusicSessionController } from "@/audio/playback/react";
import { PercentSlider } from "@/components/music/PercentSlider";
import { durationLabel } from "@/components/music/format";
import { ControlSection } from "./ControlSection";

export function MusicPlaybackSection() {
  const music = useMusicSettings();
  const runtime = useMusicRuntime();
  const controller = useMusicSessionController();
  const livePosition = useMusicPosition();
  const [scrubPosition, setScrubPosition] = useState<number | null>(null);
  const position = scrubPosition ?? livePosition;
  const canSeek = runtime.status === "playing" || runtime.status === "gap";
  return (
    <ControlSection
      id="playback"
      aside={<Switch aria-label="Enable procedural music" checked={music.enabled} onCheckedChange={setMusicEnabled} />}
    >
      <PercentSlider
        label="Master volume"
        ariaLabel="Studio music volume"
        value={music.volume}
        onChange={setMusicVolume}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <Label>Position</Label>
          <Badge variant="outline">
            {durationLabel(position)} / {durationLabel(runtime.durationSeconds)}
          </Badge>
        </div>
        <Slider
          aria-label="Music position"
          min={0}
          max={runtime.durationSeconds}
          step={0.5}
          value={position}
          disabled={!canSeek}
          onValueChange={(next) => setScrubPosition(sliderValue(next))}
          onValueCommitted={(next) => {
            setScrubPosition(null);
            controller.seek(sliderValue(next));
          }}
        />
      </div>
    </ControlSection>
  );
}
