import { ProceduralMusic } from "@/audio/ProceduralMusic";
import { useMusicSettings } from "@/audio/musicSettings";
import { PlayerMusicControls } from "@/components/music/PlayerMusicControls";
import { MusicInfoDialog } from "@/components/music/MusicInfoDialog";
import { NotificationBanner } from "./notifications/NotificationBanner";
import { useSystemMediaArtwork } from "./useSystemMediaArtwork";
export function App() {
  const settings = useMusicSettings();
  useSystemMediaArtwork(settings.systemMediaControls);
  return (
    <>
      <a className="skip-link" href="#studio">
        Skip to the studio
      </a>
      <ProceduralMusic />
      <header className="site-header">
        <a href="#studio" className="wordmark" aria-label="Lilt home">
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <path d="M7 22c4-15 7-15 10 0s7 15 12-9M7 13c4 15 7 15 10 0s7-15 12 9" />
          </svg>
          lilt<span className="brand-dot">.</span>
        </a>
        <span className="header-note">A little room for endless music.</span>
        <MusicInfoDialog />
      </header>
      <main id="studio" tabIndex={-1}>
        <div className="intro">
          <div>
            <p className="eyebrow">THE PROCEDURAL MUSIC STUDIO</p>
            <h1>Let a little music happen.</h1>
            <p>Original melodies. Familiar warmth. A new piece, every time.</p>
          </div>
          <span className="local-badge">
            <span /> Made on your device
          </span>
        </div>
        <PlayerMusicControls />
      </main>
      <footer className="site-footer">
        <span>Composed in the moment. Kept if you love it.</span>
        <span>Lilt · A procedural lute ensemble</span>
      </footer>
      <NotificationBanner />
    </>
  );
}
