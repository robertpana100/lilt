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
    <section className="repertoire-panel" aria-label="Repertoire">
      <MusicDirectionControls settings={settings} favoriteCount={library.favorites.length} />
      <div className="composition-controls">
        <MusicCompositionControls
          config={config}
          root={getMusicRoot(config.rootId)}
          locked={settings.controlMode !== "override" || !settings.enabled}
        />
      </div>
    </section>
  );
}
