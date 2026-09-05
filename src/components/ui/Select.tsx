import type { ComponentProps } from "react";
import * as stylex from "@stylexjs/stylex";
import { colors } from "./tokens.stylex";
import { controlStyles } from "./controlStyles";

export function Select(props: Omit<ComponentProps<"select">, "className" | "style">) {
  return (
    <span {...stylex.props(styles.wrapper)}>
      <select
        {...props}
        {...stylex.props(controlStyles.input, controlStyles.focus, controlStyles.disabled, styles.select)}
      />
      <svg {...stylex.props(styles.chevron)} viewBox="0 0 16 16" aria-hidden="true">
        <path d="m5 6 3 3 3-3" />
      </svg>
    </span>
  );
}

const styles = stylex.create({
  wrapper: { display: "grid", position: "relative", minWidth: 0 },
  select: { paddingRight: 32 },
  chevron: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    width: 16,
    height: 16,
    fill: "none",
    stroke: colors.muted,
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    pointerEvents: "none",
  },
});
