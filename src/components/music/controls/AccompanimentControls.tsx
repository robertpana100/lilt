import * as stylex from "@stylexjs/stylex";
import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { PercentSlider } from "../PercentSlider";
import { ChordControls } from "./ChordControls";
import { styles } from "./styles";

export function AccompanimentControls() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  return (
    <div {...stylex.props(styles.stack)}>
      <Switch
        label="Play accompaniment"
        checked={!session.mutedParts.rhythm}
        onCheckedChange={(enabled) => controller.setPartMuted("rhythm", !enabled)}
      />
      {!session.mutedParts.rhythm && (
        <div {...stylex.props(styles.grid)}>
          <PercentSlider
            label="Volume"
            ariaLabel="Accompaniment volume"
            value={session.rhythmLute.level}
            onChange={(level) => controller.setRhythmLute({ level })}
          />
          <PercentSlider
            label="Rhythmic activity"
            value={session.rhythmLute.density}
            description="Higher values add more chord gestures."
            onChange={(density) => controller.setRhythmLute({ density })}
          />
          <ChordControls
            part="Accompaniment"
            maxNotes={session.rhythmLute.maxCourses}
            strumMs={session.rhythmLute.strumMs}
            onMaxNotesChange={(maxCourses) => controller.setRhythmLute({ maxCourses })}
            onStrumChange={(strumMs) => controller.setRhythmLute({ strumMs })}
          />
          <div {...stylex.props(styles.fullWidth)}>
            <Button variant="quiet" onClick={() => controller.resetRhythmLute()}>
              Reset accompaniment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
