import { Slider } from "@/components/ui/Slider";
import * as stylex from "@stylexjs/stylex";
import { styles } from "@/components/music/styles";
import { useState } from "react";
import { useMusicPosition, useMusicRuntime, useMusicSessionController } from "@/audio/playback/react";
import { durationLabel } from "../format";

export function TrackProgress({ duration }: { duration: number }) {
  const livePosition = useMusicPosition();
  const runtime = useMusicRuntime();
  const controller = useMusicSessionController();
  const [scrubPosition, setScrubPosition] = useState<number | null>(null);
  const position = Math.min(duration, Math.max(0, scrubPosition ?? livePosition));
  const canSeek = runtime.status === "playing" || runtime.status === "gap";
  const commit = (value: number) => {
    setScrubPosition(null);
    controller.seek(value);
  };
  return (
    <div {...stylex.props(styles.trackProgress)}>
      <span {...stylex.props(styles.progressTime)}>{durationLabel(position)}</span>
      <Slider
        aria-label="Music position"
        aria-valuetext={`${durationLabel(position)} of ${durationLabel(duration)}`}
        min={0}
        max={duration || 1}
        step={0.5}
        value={position}
        disabled={!canSeek}
        onChange={(event) => setScrubPosition(event.currentTarget.valueAsNumber)}
        onPointerUp={(event) => commit(event.currentTarget.valueAsNumber)}
        onKeyUp={(event) => {
          if (
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)
          )
            commit(event.currentTarget.valueAsNumber);
        }}
        onBlur={() => {
          if (scrubPosition !== null) commit(scrubPosition);
        }}
        onPointerCancel={() => setScrubPosition(null)}
      />
      <span {...stylex.props(styles.progressTime)}>{durationLabel(duration)}</span>
    </div>
  );
}
