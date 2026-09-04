import { useMusicLibrary } from "@/audio/musicLibrary";
import { getMusicRoot } from "@/audio/composition/roots";
import { useMusicSession } from "@/audio/playback/react";
import { useMusicSettings } from "@/audio/musicSettings";
import { MusicCompositionControls } from "./MusicCompositionControls";
import { MusicDirectionControls } from "./MusicDirectionControls";
export function RepertoirePanel() {
  const settings = useMusicSettings();
  const config = useMusicSession();
  const library = useMusicLibrary();
  return (
    <section className="repertoire-panel" aria-labelledby="repertoire-title">
      <div className="panel-heading">
        <p className="eyebrow">01 / FIND YOUR FLOW</p>
        <h2 id="repertoire-title">A mood of your own.</h2>
        <p>Let the ensemble wander, or take a hand in what comes next.</p>
      </div>
      <MusicDirectionControls settings={settings} favoriteCount={library.favorites.length} />
      <div className="composition-controls">
        <MusicCompositionControls
          config={config}
          root={getMusicRoot(config.rootId)}
          locked={settings.controlMode !== "override" || !settings.enabled}
        />
      </div>
      {!settings.enabled && <p className="helper-note">Play music to use the composition controls.</p>}
      <p className="studio-footnote">
        Two lutes, four modes, endless possibilities.
        <br />
        Every note is composed and synthesized right here.
      </p>
    </section>
  );
}
