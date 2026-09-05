import * as stylex from "@stylexjs/stylex";
import { colors } from "./tokens.stylex";

export const darkTheme = stylex.createTheme(colors, {
  "--page-background": "#171717",
  "--page-text": "#eeeeee",
  surface: "#202020",
  hover: "#2b2b2b",
  muted: "#a3a3a3",
  line: "#303030",
  controlLine: "#404040",
  fill: "#e5e5e5",
  onFill: "#171717",
  track: "#404040",
  error: "#f3a0a0",
});
