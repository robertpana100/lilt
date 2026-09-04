import { setMusicDirection } from "@/audio/playback/favorites";
import { useMusicSettings } from "@/audio/musicSettings";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MusicPieceSections } from "./MusicPieceSections";
import { MusicCompositionSection } from "./MusicCompositionSection";
import { MusicArrangementSections } from "./MusicArrangementSections";
import { MusicEffectsSection } from "./MusicEffectsSection";
import { MusicPlaybackSection } from "./MusicPlaybackSection";
export default function SoundDesk() {
  const settings = useMusicSettings();
  return (
    <section aria-labelledby="sound-desk-title">
      <h2 id="sound-desk-title" className="sr-only">
        Sound desk
      </h2>
      {settings.controlMode !== "override" ? (
        <div className="manual-invitation">
          <Button onClick={() => setMusicDirection("override")}>Enable manual controls</Button>
        </div>
      ) : (
        <>
          <Tabs defaultValue="score">
            <TabsList aria-label="Sound desk controls" className="sound-desk-tabs">
              <TabsTrigger value="score">Score</TabsTrigger>
              <TabsTrigger value="instruments">Instruments</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
              <TabsTrigger value="playback">Playback</TabsTrigger>
            </TabsList>
            <TabsContent value="score">
              <MusicPieceSections />
              <MusicCompositionSection />
            </TabsContent>
            <TabsContent value="instruments">
              <MusicArrangementSections />
            </TabsContent>
            <TabsContent value="effects">
              <MusicEffectsSection />
            </TabsContent>
            <TabsContent value="playback">
              <MusicPlaybackSection />
            </TabsContent>
          </Tabs>
        </>
      )}
    </section>
  );
}
