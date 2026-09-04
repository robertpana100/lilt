import { lazy, Suspense } from "react";
import { getMusicRoot } from "@/audio/composition/roots";
import { useMusicRuntime } from "@/audio/playback/react";
import { useMusicSettings } from "@/audio/musicSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MusicLibrarySection } from "./library/MusicLibrarySection";
import { NowPlayingCard } from "./now-playing/NowPlayingCard";
import { SystemMediaToggle } from "./now-playing/SystemMediaToggle";
import { RepertoirePanel } from "./repertoire/RepertoirePanel";
const SoundDesk = lazy(() => import("./workbench/SoundDesk"));

export function PlayerMusicControls() {
  const settings = useMusicSettings();
  const runtime = useMusicRuntime();
  return (
    <div className="studio-grid">
      <div className="listening-room">
        <NowPlayingCard
          root={getMusicRoot(runtime.rootId)}
          runtime={runtime}
          enabled={settings.enabled}
          volume={settings.volume}
        />
        <SystemMediaToggle enabled={settings.systemMediaControls} />
      </div>
      <Tabs defaultValue="repertoire" className="workspace">
        <TabsList aria-label="Studio workspace" variant="line" className="workspace-nav">
          <TabsTrigger value="repertoire">Repertoire</TabsTrigger>
          <TabsTrigger value="sound-desk">Sound desk</TabsTrigger>
          <TabsTrigger value="library">Your library</TabsTrigger>
        </TabsList>
        <TabsContent value="repertoire">
          <RepertoirePanel />
        </TabsContent>
        <TabsContent value="sound-desk">
          <Suspense fallback={<p role="status">Loading…</p>}>
            <SoundDesk />
          </Suspense>
        </TabsContent>
        <TabsContent value="library">
          <MusicLibrarySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
