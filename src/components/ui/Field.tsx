import type { ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { colors, space } from "./tokens.stylex";

export function Field({
  label,
  inline,
  compact,
  children,
}: {
  label: string;
  inline?: boolean;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <label {...stylex.props(styles.field, inline && styles.inline)}>
      <span {...stylex.props(compact && styles.compact)}>{label}</span>
      {children}
    </label>
  );
}

const styles = stylex.create({
  field: { display: "flex", flexDirection: "column", gap: space.sm, minWidth: 0, fontSize: 12 },
  inline: { flexDirection: "row", alignItems: "center", gap: space.md, color: colors.muted },
  compact: { display: { default: "block", "@media (max-width: 640px)": "none" } },
});
