import type { CoverArtColors } from "@/audio/cover-art/design";
import type { Appearance } from "./store";
export const COVER_COLORS: Record<Appearance, CoverArtColors> = {
  light: { background: "#eeeeee", foreground: "#404040" },
  dark: { background: "#292929", foreground: "#c8c8c8" },
};
