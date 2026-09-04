import { MUSIC_FORM_LABELS, type MusicRoot } from "@/audio/composition/roots";
import type { MusicRuntimeSnapshot } from "@/audio/playback/types";
import { LuteLineup } from "../LuteLineup";
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
    <section className="player-card" aria-label="Music player">
      <div className="player-topline">
        <span className="eyebrow">THE LISTENING ROOM</span>
        <span className="player-status" data-playing={sounding}>
          <span />
          {sounding
            ? musicStatusLabel(runtime.status)
            : runtime.status === "error"
              ? "Audio unavailable"
              : "Ready when you are"}
        </span>
      </div>
      <div className="player-transport">
        <MusicTransport enabled={enabled} volume={volume} />
      </div>
      <div className="record-sleeve">
        <div className="sleeve-caption">
          LILT RECORDINGS <span>GENERATED WITH CARE</span>
        </div>
        <div className="cover-frame">
          <MusicCoverArt subject={runtime} size={244} label={`Cover of ${runtime.name}`} />
        </div>
        <div className="sleeve-bottom">
          <span>{root.theme}</span>
          <span>
            {root.meter} · {root.mode}
          </span>
        </div>
      </div>
      <div className="track-heading">
        <p className="eyebrow">{root.name}</p>
        <h2>{runtime.name}</h2>
        <p>
          {MUSIC_FORM_LABELS[runtime.form]} · {runtime.piece.bpm} BPM
        </p>
      </div>
      <TrackProgress duration={runtime.durationSeconds} />
      {runtime.status === "error" && (
        <p role="alert" className="audio-error">
          Audio could not start. Press Play to try again in a browser with Web Audio support.
        </p>
      )}
      <div className="player-lineup">
        <LuteLineup lineup={runtime.lineup} />
      </div>
    </section>
  );
}
