import type { CoverArtColors } from "@/audio/cover-art/design";
import type { Appearance } from "./store";
export const COVER_COLORS: Record<Appearance, CoverArtColors> = {
  light: { background: "#e3e9df", foreground: "#45624f" },
  dark: { background: "#252e28", foreground: "#a2bda2" },
};
