import { setMusicControlMode, useMusicSettings } from "@/audio/musicSettings";
import { Button } from "@/components/ui/button";
import { MusicDirectionControls } from "../repertoire/MusicDirectionControls";
import { MusicPieceSections } from "./MusicPieceSections";
import { MusicCompositionSection } from "./MusicCompositionSection";
import { MusicArrangementSections } from "./MusicArrangementSections";
import { MusicEffectsSection } from "./MusicEffectsSection";
export default function SoundDesk() {
  const settings = useMusicSettings();
  const manual = settings.controlMode === "override";
  return (
    <section className="workbench" aria-labelledby="sound-desk-title">
      <div className="workspace-heading">
        <h2 id="sound-desk-title" className="panel-title">
          Sound desk
        </h2>
        <div className="direction-controls">
          <MusicDirectionControls settings={settings} />
          {!manual && (
            <Button size="sm" onClick={() => setMusicControlMode("override")}>
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
