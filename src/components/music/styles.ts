import * as stylex from "@stylexjs/stylex";
import { colors, space } from "../ui/tokens.stylex";

const MOBILE = "@media (max-width: 640px)";
const NARROW = "@media (max-width: 380px)";

export const styles = stylex.create({
  studioLayout: {
    maxWidth: 880,
    marginInline: "auto",
    paddingTop: space.lg,
    paddingBottom: 48,
    paddingInline: { default: space.xxl, [MOBILE]: space.xl, [NARROW]: space.lg },
  },
  player: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr) 300px", [MOBILE]: "minmax(0, 1fr)" },
    gap: { default: space.xl, [MOBILE]: space.lg },
    alignItems: "center",
  },
  currentTrack: { display: "flex", alignItems: "center", gap: space.lg, minWidth: 0 },
  trackInfo: { minWidth: 0 },
  trackTitle: {
    overflowWrap: "anywhere",
    marginTop: space.xs,
    marginBottom: space.xs,
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: "-0.5px",
    lineHeight: 1.3,
  },
  trackMeta: { color: colors.muted, fontSize: 12 },
  playerStatus: { color: colors.muted, fontSize: 11 },
  transportControls: { display: "flex", flexDirection: "column", gap: space.md },
  playbackControls: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: space.lg },
  compositionActions: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: space.sm },
  volumeControl: {
    display: "flex",
    alignItems: "center",
    gap: space.md,
    color: colors.muted,
    fontSize: 11,
    width: 156,
  },
  trackProgress: { gridColumnEnd: "-1", gridColumnStart: "1", display: "flex", alignItems: "center", gap: space.md },
  progressTime: { color: colors.muted, fontSize: 11, fontVariantNumeric: "tabular-nums" },
  trackDetails: { gridColumnEnd: "-1", gridColumnStart: "1", marginTop: -12 },
  lineup: { margin: 0, padding: 0, listStyleType: "none" },
  audioError: { gridColumnEnd: "-1", gridColumnStart: "1", color: colors.error },
});
