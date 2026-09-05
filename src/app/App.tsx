import { AppearanceControl } from "@/appearance/AppearanceControl";
import { ProceduralMusic } from "@/audio/ProceduralMusic";
import { PlayerMusicControls } from "@/components/music/PlayerMusicControls";
import { NotificationBanner } from "./notifications/NotificationBanner";
import { useSystemMediaArtwork } from "./useSystemMediaArtwork";
import * as stylex from "@stylexjs/stylex";
import { colors, space } from "@/components/ui/tokens.stylex";
import { controlStyles } from "@/components/ui/controlStyles";
export function App() {
  useSystemMediaArtwork();
  return (
    <>
      <a {...stylex.props(controlStyles.focus, styles.skipLink)} href="#studio">
        Skip to controls
      </a>
      <ProceduralMusic />
      <header {...stylex.props(styles.header)}>
        <h1 {...stylex.props(styles.wordmark)}>
          <svg {...stylex.props(styles.logo)} viewBox="0 0 24 24" aria-hidden="true">
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

const styles = stylex.create({
  header: {
    maxWidth: 880,
    marginInline: "auto",
    paddingBlock: space.xl,
    paddingInline: { default: space.xxl, "@media (max-width: 640px)": space.xl, "@media (max-width: 380px)": space.lg },
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.lg,
  },
  wordmark: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: "-0.6px",
  },
  logo: { width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" },
  skipLink: {
    position: "fixed",
    top: space.sm,
    left: space.sm,
    paddingBlock: space.sm,
    paddingInline: space.md,
    color: colors.onFill,
    backgroundColor: colors.fill,
    borderRadius: 4,
    transform: { default: "translateY(-180%)", ":focus": "translateY(0)" },
    zIndex: 100,
  },
});
