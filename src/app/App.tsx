import { AppearanceControl } from "@/appearance/AppearanceControl";
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
        <h1 className="wordmark">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12h2m3-5v10m4-14v18m4-15v12m4-8v4" />
          </svg>
          Lilt
        </h1>
        <AppearanceControl />
      </header>
      <main id="studio" tabIndex={-1}>
        <PlayerMusicControls />
      </main>
      <NotificationBanner />
    </>
  );
}
