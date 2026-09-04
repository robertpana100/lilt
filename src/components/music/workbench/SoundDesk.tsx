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
      <div className="panel-heading">
        <p className="eyebrow">02 / MAKE IT YOURS</p>
        <h2 id="sound-desk-title">A closer listen.</h2>
        <p>Shape the score, find your instrument, and dial in the room.</p>
      </div>
      {settings.controlMode !== "override" ? (
        <div className="manual-invitation">
          <p>Take the lead to edit the score. You can return to automatic listening in Repertoire.</p>
          <Button onClick={() => setMusicDirection("override")}>Take the lead</Button>
        </div>
      ) : (
        <>
          <p className="helper-note mb-5">
            These edits last for this session. Favourite a played take to keep its exact recipe.
          </p>
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
