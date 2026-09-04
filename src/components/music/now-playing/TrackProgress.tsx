import { useMusicPosition } from "@/audio/playback/react";
import { durationLabel } from "../format";
export function TrackProgress({ duration }: { duration: number }) {
  const position = Math.min(duration, Math.max(0, useMusicPosition()));
  return (
    <div className="track-progress">
      <progress aria-label="Track progress" value={position} max={duration || 1} />
      <div>
        <span>{durationLabel(position)}</span>
        <span>{durationLabel(duration)}</span>
      </div>
    </div>
  );
}
