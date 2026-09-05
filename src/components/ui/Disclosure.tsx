import { useId, useState, type ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { colors, space } from "./tokens.stylex";
import { controlStyles } from "./controlStyles";

/** Hidden contents unmount so closed sections do not run hooks or expensive tools. */
export function Disclosure({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  compact?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div {...stylex.props(styles.root, !compact && styles.divided)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        {...stylex.props(controlStyles.focus, styles.trigger, compact && styles.compact)}
      >
        {title}
        <svg viewBox="0 0 16 16" aria-hidden="true" {...stylex.props(styles.chevron, open && styles.open)}>
          <path d="m6 4 4 4-4 4" />
        </svg>
      </button>
      <div id={id} hidden={!open}>
        {open && <div {...stylex.props(styles.content, compact && styles.compactContent)}>{children}</div>}
      </div>
    </div>
  );
}

const styles = stylex.create({
  root: { minWidth: 0 },
  divided: { borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: colors.line },
  trigger: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
    width: "100%",
    paddingBlock: space.lg,
    paddingInline: 0,
    borderWidth: 0,
    borderRadius: 2,
    color: { default: colors["--page-text"], ":hover": colors.muted },
    backgroundColor: "transparent",
    textAlign: "left",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  compact: {
    width: "fit-content",
    paddingBlock: space.xs,
    color: { default: colors.muted, ":hover": colors["--page-text"] },
    fontSize: 12,
    fontWeight: 400,
  },
  chevron: {
    width: 14,
    height: 14,
    fill: "none",
    stroke: colors.muted,
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    flexShrink: 0,
  },
  open: { transform: "rotate(90deg)" },
  content: { display: "flex", flexDirection: "column", gap: space.xl, paddingTop: space.xs, paddingBottom: space.xl },
  compactContent: { gap: space.sm, paddingTop: space.md, paddingBottom: 0, color: colors.muted, fontSize: 12 },
});
