import { MUSIC_FORM_LABELS, type MusicRoot } from "@/audio/composition/roots";
import type { MusicRuntimeSnapshot } from "@/audio/playback/types";
import { MusicCoverArt } from "../MusicCoverArt";
import { musicStatusLabel } from "../format";
import { MusicTransport } from "./MusicTransport";
import { TrackProgress } from "./TrackProgress";
interface NowPlayingCardProps {
  root: MusicRoot;
  runtime: MusicRuntimeSnapshot;
  enabled: boolean;
  volume: number;
}
export function NowPlayingCard({ root, runtime, enabled, volume }: NowPlayingCardProps) {
  const sounding = enabled && (runtime.status === "playing" || runtime.status === "gap");
  return (
    <section className="player-strip" aria-label="Music player">
      <div className="current-track">
        <MusicCoverArt subject={runtime} size={72} label={`Cover of ${runtime.name}`} />
        <div className="track-info">
          <span className="player-status" data-playing={sounding}>
            {sounding ? musicStatusLabel(runtime.status) : runtime.status === "error" ? "Audio unavailable" : "Paused"}
          </span>
          <h2 title={runtime.name}>{runtime.name}</h2>
          <p>
            {root.name} · {runtime.piece.bpm} BPM · {root.meter}
          </p>
          <span className="track-form">{MUSIC_FORM_LABELS[runtime.form]}</span>
        </div>
      </div>
      <MusicTransport enabled={enabled} volume={volume} />
      <TrackProgress duration={runtime.durationSeconds} />
      {runtime.status === "error" && (
        <p role="alert" className="audio-error">
          Audio unavailable. Press Play to retry.
        </p>
      )}
    </section>
  );
}
