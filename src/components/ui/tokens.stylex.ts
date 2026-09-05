import * as stylex from "@stylexjs/stylex";

export const colors = stylex.defineVars({
  // Stable names let the small document reset share the page colors.
  "--page-background": "#fafafa",
  "--page-text": "#222222",
  surface: "#ffffff",
  hover: "#f0f0f0",
  muted: "#737373",
  line: "#e5e5e5",
  controlLine: "#d4d4d4",
  fill: "#262626",
  onFill: "#ffffff",
  track: "#dedede",
  error: "#a32929",
});

export const space = stylex.defineVars({
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  xxl: "32px",
});

export const control = stylex.defineVars({
  height: "36px",
  radius: "6px",
  fontSize: "13px",
});
