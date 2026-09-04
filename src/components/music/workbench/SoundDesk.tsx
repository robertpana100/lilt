import { setMusicDirection } from "@/audio/playback/favorites";
import { useMusicSettings } from "@/audio/musicSettings";
import { useMusicLibrary } from "@/audio/musicLibrary";
import { Button } from "@/components/ui/button";
import { MusicDirectionControls } from "../repertoire/MusicDirectionControls";
import { MusicPieceSections } from "./MusicPieceSections";
import { MusicCompositionSection } from "./MusicCompositionSection";
import { MusicArrangementSections } from "./MusicArrangementSections";
import { MusicEffectsSection } from "./MusicEffectsSection";
export default function SoundDesk() {
  const settings = useMusicSettings();
  const library = useMusicLibrary();
  const manual = settings.controlMode === "override";
  return (
    <section className="workbench" aria-labelledby="sound-desk-title">
      <div className="workspace-heading">
        <h2 id="sound-desk-title" className="panel-title">
          Sound desk
        </h2>
        <div className="direction-controls">
          <MusicDirectionControls settings={settings} favoriteCount={library.favorites.length} />
          {!manual && (
            <Button size="sm" onClick={() => setMusicDirection("override")}>
              Enable manual controls
            </Button>
          )}
        </div>
      </div>
      <fieldset disabled={!manual} inert={!manual} className="sound-desk-controls" aria-label="Manual controls">
        <div className="score-grid">
          <MusicPieceSections />
          <MusicCompositionSection />
        </div>
        <MusicArrangementSections />
        <MusicEffectsSection />
      </fieldset>
    </section>
  );
}
