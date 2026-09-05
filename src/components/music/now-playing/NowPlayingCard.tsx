import { Disclosure } from "@/components/ui/Disclosure";
import * as stylex from "@stylexjs/stylex";
import { styles } from "@/components/music/styles";
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
    <section {...stylex.props(styles.player)} aria-label="Music player">
      <div {...stylex.props(styles.currentTrack)}>
        <MusicCoverArt subject={runtime} size={64} label={`Cover of ${runtime.name}`} />
        <div {...stylex.props(styles.trackInfo)}>
          <p {...stylex.props(styles.playerStatus)}>
            {sounding ? musicStatusLabel(runtime.status) : runtime.status === "error" ? "Audio unavailable" : "Paused"}
          </p>
          <h2 {...stylex.props(styles.trackTitle)}>{runtime.name}</h2>
          <p {...stylex.props(styles.trackMeta)}>
            {root.name} · {runtime.piece.bpm} BPM
          </p>
        </div>
      </div>
      <MusicTransport enabled={enabled} volume={volume} />
      <TrackProgress duration={runtime.durationSeconds} />
      <div {...stylex.props(styles.trackDetails)}>
        <Disclosure title="Track details" compact>
          <p>
            {MUSIC_FORM_LABELS[runtime.form]} · {root.meter} · {midiLabel(runtime.tonicMidi)}
          </p>
          <LuteLineup lineup={runtime.lineup} />
          <p>
            Piece {runtime.pieceIndex + 1} · Section {runtime.sectionId ?? "—"} · Next pause{" "}
            {runtime.gapSeconds.toFixed(1)}s
          </p>
          <p>Composition seed: {runtime.compositionSeed}</p>
        </Disclosure>
      </div>
      {runtime.status === "error" && (
        <p role="alert" {...stylex.props(styles.audioError)}>
          Audio unavailable. Press Play to retry.
        </p>
      )}
    </section>
  );
}
