import { MUSIC_FORM_LABELS, type MusicRoot } from "@/audio/composition/roots";
import type { MusicRuntimeSnapshot } from "@/audio/playback/types";
import { MusicCoverArt } from "../MusicCoverArt";
import { LuteLineup } from "../LuteLineup";
import { musicStatusLabel } from "../format";
import { midiLabel } from "../workbench/music-labels";
import { MusicTransport } from "./MusicTransport";
import { TrackProgress } from "./TrackProgress";

export function NowPlayingCard({
  root,
  runtime,
  enabled,
  volume,
}: {
  root: MusicRoot;
  runtime: MusicRuntimeSnapshot;
  enabled: boolean;
  volume: number;
}) {
  const sounding = enabled && (runtime.status === "playing" || runtime.status === "gap");
  return (
    <section className="player" aria-label="Music player">
      <div className="current-track">
        <MusicCoverArt subject={runtime} size={64} label={`Cover of ${runtime.name}`} />
        <div className="track-info">
          <p className="player-status">
            {sounding ? musicStatusLabel(runtime.status) : runtime.status === "error" ? "Audio unavailable" : "Paused"}
          </p>
          <h2>{runtime.name}</h2>
          <p>
            {root.name} · {runtime.piece.bpm} BPM
          </p>
        </div>
      </div>
      <MusicTransport enabled={enabled} volume={volume} />
      <TrackProgress duration={runtime.durationSeconds} />
      <details className="track-details">
        <summary>Track details</summary>
        <p>
          {MUSIC_FORM_LABELS[runtime.form]} · {root.meter} · {midiLabel(runtime.tonicMidi)}
        </p>
        <LuteLineup lineup={runtime.lineup} />
        <p>
          Piece {runtime.pieceIndex + 1} · Section {runtime.sectionId ?? "—"} · Next pause{" "}
          {runtime.gapSeconds.toFixed(1)}s
        </p>
        <p>Composition seed: {runtime.compositionSeed}</p>
      </details>
      {runtime.status === "error" && (
        <p role="alert" className="audio-error">
          Audio unavailable. Press Play to retry.
        </p>
      )}
    </section>
  );
}
