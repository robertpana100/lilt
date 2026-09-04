import { getMusicRoot } from "@/audio/composition/roots";
import { useMusicRuntime } from "@/audio/playback/react";
import { useMusicSettings } from "@/audio/musicSettings";
import { NowPlayingCard } from "./now-playing/NowPlayingCard";
import { SystemMediaToggle } from "./now-playing/SystemMediaToggle";
import SoundDesk from "./workbench/SoundDesk";
export function PlayerMusicControls() {
  const settings = useMusicSettings();
  const runtime = useMusicRuntime();
  return (
    <div className="studio-layout">
      <NowPlayingCard
        root={getMusicRoot(runtime.rootId)}
        runtime={runtime}
        enabled={settings.enabled}
        volume={settings.volume}
      />
      <div className="studio-utility">
        <SystemMediaToggle enabled={settings.systemMediaControls} />
      </div>
      <SoundDesk />
    </div>
  );
}
