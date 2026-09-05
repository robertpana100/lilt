import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import * as stylex from "@stylexjs/stylex";
import { styles } from "@/components/music/styles";
import { getMusicRoot, MUSIC_FORM_LABELS, type MusicPieceForm } from "@/audio/composition/roots";
import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { NumberField } from "@/components/ui/NumberField";
import { Switch } from "@/components/ui/Switch";
import { midiLabel } from "./music-labels";

export function MusicCompositionSection() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  const root = getMusicRoot(session.rootId);
  return (
    <>
      <div {...stylex.props(styles.controlGrid)}>
        <NumberField
          label="Master seed"
          value={session.masterSeed}
          onChange={(seed) => controller.setMasterSeed(seed)}
        />
        <Field label="Form">
          <Select
            aria-label="Music form lock"
            value={session.formOverride ?? "auto"}
            onChange={(event) =>
              controller.setFormOverride(
                event.currentTarget.value === "auto" ? null : (event.currentTarget.value as MusicPieceForm),
              )
            }
          >
            <option value="auto">Automatic</option>
            {root.forms.map((form) => (
              <option key={form} value={form}>
                {MUSIC_FORM_LABELS[form]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Key">
          <Select
            aria-label="Music tonic lock"
            value={session.tonicOverride?.toString() ?? "auto"}
            onChange={(event) =>
              controller.setTonicOverride(
                event.currentTarget.value === "auto" ? null : Number(event.currentTarget.value),
              )
            }
          >
            <option value="auto">Automatic</option>
            {root.safeTonics.map((tonic) => (
              <option key={tonic} value={tonic}>
                {midiLabel(tonic)}
              </option>
            ))}
          </Select>
        </Field>
        <Switch
          label="Continue to the next piece"
          ariaLabel="Automatic next music piece"
          checked={session.autoAdvance}
          onCheckedChange={(enabled) => controller.setAutoAdvance(enabled)}
        />
      </div>
      <div {...stylex.props(styles.buttonRow)}>
        <Button type="button" onClick={() => controller.newVariation()}>
          New variation
        </Button>
        <Button type="button" onClick={() => controller.newPerformance()}>
          New performance
        </Button>
      </div>
    </>
  );
}
