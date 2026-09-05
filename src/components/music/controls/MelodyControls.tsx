import * as stylex from "@stylexjs/stylex";
import { getMusicRoot, MUSIC_FORM_LABELS, type MusicPieceForm } from "@/audio/composition/roots";
import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { PercentSlider } from "../PercentSlider";
import { noteName } from "../music-labels";
import { ChordControls } from "./ChordControls";
import { styles } from "./styles";

export function MelodyControls() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  const preset = getMusicRoot(session.rootId);
  return (
    <div {...stylex.props(styles.stack)}>
      <Switch
        label="Play melody"
        checked={!session.mutedParts.strings}
        onCheckedChange={(enabled) => controller.setPartMuted("strings", !enabled)}
      />
      {!session.mutedParts.strings && (
        <div {...stylex.props(styles.grid)}>
          {preset.forms.length > 1 && (
            <Field label="Song structure">
              <Select
                aria-label="Song structure"
                value={session.formOverride ?? "auto"}
                options={[
                  { value: "auto", label: "Choose for each track" },
                  ...preset.forms.map((form) => ({ value: form, label: MUSIC_FORM_LABELS[form] })),
                ]}
                onValueChange={(value) =>
                  controller.setFormOverride(value === "auto" ? null : (value as MusicPieceForm))
                }
              />
            </Field>
          )}
          <Field label="Key">
            <Select
              aria-label="Key"
              value={session.tonicOverride?.toString() ?? "auto"}
              options={[
                { value: "auto", label: "Choose for each track" },
                ...preset.safeTonics.map((tonic) => ({
                  value: String(tonic),
                  label: `${noteName(tonic)} ${preset.mode}`,
                })),
              ]}
              onValueChange={(value) => controller.setTonicOverride(value === "auto" ? null : Number(value))}
            />
          </Field>
          <PercentSlider
            label="Melodic variation"
            value={session.novelty}
            description="Adds changes when musical phrases repeat."
            onChange={(value) => controller.setNovelty(value)}
          />
          <PercentSlider
            label="Added harmony"
            value={session.chords.amount}
            description="How often the melody plays extra chord notes."
            onChange={(amount) => controller.setChords({ amount })}
          />
          {session.chords.amount > 0 && (
            <ChordControls
              part="Melody"
              maxNotes={session.chords.maxCourses}
              strumMs={session.chords.strumMs}
              onMaxNotesChange={(maxCourses) => controller.setChords({ maxCourses })}
              onStrumChange={(strumMs) => controller.setChords({ strumMs })}
            />
          )}
          <div {...stylex.props(styles.fullWidth)}>
            <Button variant="quiet" onClick={() => controller.resetChords()}>
              Reset melody harmony
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
