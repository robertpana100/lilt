import * as stylex from "@stylexjs/stylex";
import { colors, control, space } from "./tokens.stylex";

export const controlStyles = stylex.create({
  focus: {
    outlineStyle: { default: "none", ":focus-visible": "solid" },
    outlineWidth: 2,
    outlineColor: colors.fill,
    outlineOffset: 3,
  },
  disabled: {
    opacity: { default: 1, ":disabled": 0.4 },
    cursor: { default: "pointer", ":disabled": "not-allowed" },
  },
  input: {
    appearance: "none",
    width: "100%",
    minWidth: 0,
    minHeight: control.height,
    margin: 0,
    paddingBlock: space.sm,
    paddingInline: space.md,
    color: colors["--page-text"],
    backgroundColor: { default: colors.surface, ":hover:not(:disabled)": colors.hover },
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: colors.controlLine, ":hover:not(:disabled)": colors.muted },
    borderRadius: control.radius,
    fontSize: control.fontSize,
    lineHeight: 1.4,
  },
});
