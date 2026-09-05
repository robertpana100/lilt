import * as stylex from "@stylexjs/stylex";
import { getMusicRoot, MUSIC_ROOTS, type MusicRootId } from "@/audio/composition/roots";
import { setMusicControlMode, useMusicSettings } from "@/audio/musicSettings";
import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { RangeField } from "@/components/ui/RangeField";
import { styles } from "./styles";

export function StyleControls() {
  const settings = useMusicSettings();
  const session = useMusicSession();
  const controller = useMusicSessionController();
  const preset = getMusicRoot(session.rootId);
  const automatic = settings.controlMode === "auto";
  return (
    <div {...stylex.props(styles.basics, styles.grid)}>
      <div>
        <Field label="Style">
          <Select
            aria-label="Style"
            value={automatic ? "auto" : session.rootId}
            onValueChange={(value) => {
              if (value === "auto") {
                setMusicControlMode("auto");
              } else {
                setMusicControlMode("override");
                if (value !== session.rootId) controller.setRoot(value as MusicRootId);
              }
            }}
            options={[
              { value: "auto", label: "Automatic · changes each track" },
              ...MUSIC_ROOTS.map((entry) => ({ value: entry.id, label: entry.name })),
            ]}
          />
        </Field>
        <p {...stylex.props(styles.hint, styles.styleHint)}>
          {automatic && `Now: ${preset.name}. `}
          {preset.description}
        </p>
      </div>
      <RangeField
        label="Tempo"
        value={session.bpm}
        min={preset.tempo.min}
        max={preset.tempo.max}
        display={`${session.bpm} BPM`}
        description={automatic ? "Automatic style picks a new tempo for each track." : "Sets the pace of the music."}
        onChange={(bpm) => controller.setBpm(bpm)}
      />
    </div>
  );
}
