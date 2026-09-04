import { getMusicRoot, MUSIC_ROOTS, type MusicRootId } from "@/audio/composition/roots";
import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { PercentSlider } from "../PercentSlider";
import { RangeField } from "./ControlFields";

export function MusicPieceSections() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  const root = getMusicRoot(session.rootId);
  return (
    <section className="basic-controls" aria-label="Composition controls">
      <div className="control-grid">
        <label className="field">
          Atmosphere
          <select
            aria-label="Music root"
            value={session.rootId}
            onChange={(event) => controller.setRoot(event.currentTarget.value as MusicRootId)}
          >
            {MUSIC_ROOTS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
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
      <div className="button-row">
        <button type="button" onClick={() => controller.newComposition()}>
          New composition
        </button>
      </div>
    </section>
  );
}
