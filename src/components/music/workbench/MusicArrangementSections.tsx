import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import * as stylex from "@stylexjs/stylex";
import { styles } from "@/components/music/styles";
import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { PercentSlider } from "../PercentSlider";
import { Switch } from "@/components/ui/Switch";
import { RangeField } from "@/components/ui/RangeField";

export function MusicArrangementSections() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  return (
    <div {...stylex.props(styles.instrumentColumns)}>
      <section aria-label="Lead lute">
        <div {...stylex.props(styles.sectionHeading)}>
          <Switch
            label="Lead lute"
            ariaLabel="Enable lute strings"
            checked={!session.mutedParts.strings}
            onCheckedChange={(enabled) => controller.setPartMuted("strings", !enabled)}
          />
          <Button type="button" variant="quiet" onClick={() => controller.resetChords()}>
            Reset harmony
          </Button>
        </div>
        {!session.mutedParts.strings && (
          <div {...stylex.props(styles.instrumentFields)}>
            <PercentSlider
              label="Chord amount"
              ariaLabel="Music chord amount"
              value={session.chords.amount}
              onChange={(amount) => controller.setChords({ amount })}
            />
            <Field label="Courses">
              <Select
                aria-label="Music chord maximum courses"
                value={String(session.chords.maxCourses)}
                onValueChange={(value) => controller.setChords({ maxCourses: value === "2" ? 2 : 3 })}
                options={[
                  { value: "2", label: "2 · Dyads" },
                  { value: "3", label: "3 · Triads" },
                ]}
              />
            </Field>
            <RangeField
              label="Strum spread"
              ariaLabel="Music chord strum spread"
              value={session.chords.strumMs}
              max={40}
              display={`${session.chords.strumMs} ms`}
              disabled={session.chords.amount === 0}
              onChange={(strumMs) => controller.setChords({ strumMs })}
            />
          </div>
        )}
      </section>
      <section aria-label="Rhythm lute">
        <div {...stylex.props(styles.sectionHeading)}>
          <Switch
            label="Rhythm lute"
            ariaLabel="Enable rhythm lute"
            checked={!session.mutedParts.rhythm}
            onCheckedChange={(enabled) => controller.setPartMuted("rhythm", !enabled)}
          />
          <Button type="button" variant="quiet" onClick={() => controller.resetRhythmLute()}>
            Reset rhythm lute
          </Button>
        </div>
        {!session.mutedParts.rhythm && (
          <div {...stylex.props(styles.instrumentFields)}>
            <PercentSlider
              label="Density"
              ariaLabel="Music rhythm lute chord density"
              value={session.rhythmLute.density}
              onChange={(density) => controller.setRhythmLute({ density })}
            />
            <PercentSlider
              label="Level"
              ariaLabel="Music rhythm lute level"
              value={session.rhythmLute.level}
              onChange={(level) => controller.setRhythmLute({ level })}
            />
            <Field label="Courses">
              <Select
                aria-label="Music rhythm lute maximum courses"
                value={String(session.rhythmLute.maxCourses)}
                onValueChange={(value) => controller.setRhythmLute({ maxCourses: value === "2" ? 2 : 3 })}
                options={[
                  { value: "2", label: "2 · Dyads" },
                  { value: "3", label: "3 · Triads" },
                ]}
              />
            </Field>
            <RangeField
              label="Strum spread"
              ariaLabel="Music rhythm lute strum spread"
              value={session.rhythmLute.strumMs}
              max={40}
              display={`${session.rhythmLute.strumMs} ms`}
              onChange={(strumMs) => controller.setRhythmLute({ strumMs })}
            />
          </div>
        )}
      </section>
    </div>
  );
}
