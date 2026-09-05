import * as stylex from "@stylexjs/stylex";
import { styles } from "@/components/music/styles";
import { getMusicRoot } from "@/audio/composition/roots";
import { useMusicRuntime } from "@/audio/playback/react";
import { useMusicSettings } from "@/audio/musicSettings";
import { NowPlayingCard } from "./now-playing/NowPlayingCard";
import SoundDesk from "./workbench/SoundDesk";

export function PlayerMusicControls() {
  const settings = useMusicSettings();
  const runtime = useMusicRuntime();
  return (
    <div {...stylex.props(styles.studioLayout)}>
      <NowPlayingCard
        root={getMusicRoot(runtime.rootId)}
        runtime={runtime}
        enabled={settings.enabled}
        volume={settings.volume}
      />
      <SoundDesk />
    </div>
  );
}
