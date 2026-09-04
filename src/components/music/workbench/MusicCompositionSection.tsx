import { getMusicRoot, MUSIC_FORM_LABELS, type MusicPieceForm } from "@/audio/composition/roots";
import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { NumberField, CheckboxField } from "./ControlFields";
import { midiLabel } from "./music-labels";

export function MusicCompositionSection() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  const root = getMusicRoot(session.rootId);
  return (
    <>
      <div className="control-grid">
        <NumberField
          label="Master seed"
          value={session.masterSeed}
          onChange={(seed) => controller.setMasterSeed(seed)}
        />
        <label className="field">
          Form
          <select
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
          </select>
        </label>
        <label className="field">
          Key
          <select
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
          </select>
        </label>
        <CheckboxField
          label="Continue to the next piece"
          ariaLabel="Automatic next music piece"
          checked={session.autoAdvance}
          onCheckedChange={(enabled) => controller.setAutoAdvance(enabled)}
        />
      </div>
      <div className="button-row">
        <button type="button" onClick={() => controller.newVariation()}>
          New variation
        </button>
        <button type="button" onClick={() => controller.newPerformance()}>
          New performance
        </button>
      </div>
    </>
  );
}
