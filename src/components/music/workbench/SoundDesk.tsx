import { useMusicSettings } from "@/audio/musicSettings";
import { MusicDirectionControls } from "../repertoire/MusicDirectionControls";
import { MusicPieceSections } from "./MusicPieceSections";
import { MusicCompositionSection } from "./MusicCompositionSection";
import { MusicArrangementSections } from "./MusicArrangementSections";
import { MusicEffectsSection } from "./MusicEffectsSection";
import { AuditionPanel } from "./AuditionPanel";
import { Disclosure } from "./Disclosure";

export default function SoundDesk() {
  const settings = useMusicSettings();
  return (
    <section className="workbench" aria-label="Sound controls">
      <div className="workspace-heading">
        <MusicDirectionControls settings={settings} />
      </div>
      {settings.controlMode === "override" && (
        <div className="manual-controls">
          <MusicPieceSections />
          <MusicEffectsSection />
          <div className="advanced-controls">
            <Disclosure title="Composition">
              <MusicCompositionSection />
            </Disclosure>
            <Disclosure title="Instruments">
              <MusicArrangementSections />
            </Disclosure>
            <Disclosure title="Audition">
              <AuditionPanel />
            </Disclosure>
          </div>
        </div>
      )}
    </section>
  );
}
