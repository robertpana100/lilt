import type { ComponentProps } from "react";
import * as stylex from "@stylexjs/stylex";
import { colors, space } from "./tokens.stylex";
import { controlStyles } from "./controlStyles";

type ButtonProps = Omit<ComponentProps<"button">, "className" | "style"> & {
  variant?: "default" | "primary" | "quiet";
  description?: string;
};

export function Button({ variant = "default", description, children, type = "button", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      {...stylex.props(
        controlStyles.input,
        controlStyles.focus,
        controlStyles.disabled,
        styles.button,
        styles[variant],
      )}
    >
      <span>{children}</span>
      {description && <span {...stylex.props(styles.description)}>{description}</span>}
    </button>
  );
}

const styles = stylex.create({
  button: {
    width: "auto",
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    fontWeight: 500,
    textAlign: "center",
    userSelect: "none",
  },
  default: {},
  primary: {
    minWidth: 76,
    backgroundColor: { default: colors.fill, ":hover:not(:disabled)": colors["--page-text"] },
    color: colors.onFill,
    borderColor: { default: colors.fill, ":hover:not(:disabled)": colors["--page-text"] },
  },
  quiet: {
    backgroundColor: { default: "transparent", ":hover:not(:disabled)": colors.hover },
    borderColor: { default: "transparent", ":hover:not(:disabled)": "transparent" },
    color: { default: colors.muted, ":hover:not(:disabled)": colors["--page-text"] },
    paddingInline: space.sm,
    fontSize: 12,
    fontWeight: 400,
  },
  description: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: 400,
    lineHeight: 1.4,
  },
});
