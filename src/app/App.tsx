import { ProceduralMusic } from "@/audio/ProceduralMusic";
import { useMusicSettings } from "@/audio/musicSettings";
import { PlayerMusicControls } from "@/components/music/PlayerMusicControls";
import { NotificationBanner } from "./notifications/NotificationBanner";
import { useSystemMediaArtwork } from "./useSystemMediaArtwork";
export function App() {
  const settings = useMusicSettings();
  useSystemMediaArtwork(settings.systemMediaControls);
  return (
    <>
      <a className="skip-link" href="#studio">
        Skip to controls
      </a>
      <ProceduralMusic />
      <header className="site-header">
        <h1 className="wordmark">Lilt</h1>
      </header>
      <main id="studio" tabIndex={-1}>
        <PlayerMusicControls />
      </main>
      <NotificationBanner />
    </>
  );
}
