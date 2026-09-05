import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import * as stylex from "@stylexjs/stylex";
import { styles } from "@/components/music/styles";
import { getMusicRoot, MUSIC_ROOTS, type MusicRootId } from "@/audio/composition/roots";
import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { PercentSlider } from "../PercentSlider";
import { RangeField } from "@/components/ui/RangeField";

export function MusicPieceSections() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  const root = getMusicRoot(session.rootId);
  return (
    <section {...stylex.props(styles.basicControls)} aria-label="Composition controls">
      <div {...stylex.props(styles.controlGrid)}>
        <Field label="Atmosphere">
          <Select
            aria-label="Music root"
            value={session.rootId}
            onChange={(event) => controller.setRoot(event.currentTarget.value as MusicRootId)}
          >
            {MUSIC_ROOTS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </Select>
        </Field>
        <RangeField
          label="Tempo"
          ariaLabel="Studio music tempo"
          value={session.bpm}
          min={root.tempo.min}
          max={root.tempo.max}
          display={`${session.bpm} BPM`}
          onChange={(bpm) => controller.setBpm(bpm)}
        />
        <PercentSlider
          label="Variety"
          ariaLabel="Music novelty"
          value={session.novelty}
          onChange={(value) => controller.setNovelty(value)}
        />
        <PercentSlider
          label="Humanization"
          ariaLabel="Music humanization"
          value={session.humanization}
          onChange={(value) => controller.setHumanization(value)}
        />
      </div>
    </section>
  );
}
