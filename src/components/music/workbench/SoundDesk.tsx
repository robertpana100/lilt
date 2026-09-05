import * as stylex from "@stylexjs/stylex";
import { styles } from "@/components/music/styles";
import { useMusicSettings } from "@/audio/musicSettings";
import { MusicDirectionControls } from "../repertoire/MusicDirectionControls";
import { MusicPieceSections } from "./MusicPieceSections";
import { MusicCompositionSection } from "./MusicCompositionSection";
import { MusicArrangementSections } from "./MusicArrangementSections";
import { MusicEffectsSection } from "./MusicEffectsSection";
import { Disclosure } from "@/components/ui/Disclosure";

export default function SoundDesk() {
  const settings = useMusicSettings();
  return (
    <section {...stylex.props(styles.workbench)} aria-label="Sound controls">
      <div {...stylex.props(styles.workspaceHeading)}>
        <MusicDirectionControls settings={settings} />
      </div>
      {settings.controlMode === "override" && (
        <div {...stylex.props(styles.manualControls)}>
          <MusicPieceSections />
          <MusicEffectsSection />
          <div {...stylex.props(styles.advancedControls)}>
            <Disclosure title="Composition">
              <MusicCompositionSection />
            </Disclosure>
            <Disclosure title="Instruments">
              <MusicArrangementSections />
            </Disclosure>
          </div>
        </div>
      )}
    </section>
  );
}
