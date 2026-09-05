import type { ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { colors, control, space } from "./tokens.stylex";
import { controlStyles } from "./controlStyles";

export function Switch({
  label,
  checked,
  disabled,
  ariaLabel,
  onCheckedChange,
}: {
  label: ReactNode;
  checked: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label {...stylex.props(styles.label, disabled && styles.disabled)}>
      <span {...stylex.props(styles.control)}>
        <input
          type="checkbox"
          role="switch"
          aria-label={ariaLabel}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange(event.currentTarget.checked)}
          {...stylex.props(controlStyles.focus, styles.input, checked && styles.checked)}
        />
        <span aria-hidden="true" {...stylex.props(styles.thumb, checked && styles.thumbChecked)} />
      </span>
      <span>{label}</span>
    </label>
  );
}

const styles = stylex.create({
  label: {
    display: "inline-flex",
    alignItems: "center",
    gap: space.sm,
    minHeight: control.height,
    cursor: "pointer",
    fontSize: 13,
  },
  disabled: { opacity: 0.4, cursor: "not-allowed" },
  control: { position: "relative", display: "inline-flex", flexShrink: 0, width: 28, height: 16 },
  input: {
    appearance: "none",
    width: 28,
    height: 16,
    margin: 0,
    borderWidth: 0,
    borderRadius: 20,
    backgroundColor: colors.track,
    cursor: "inherit",
  },
  checked: { backgroundColor: colors.fill },
  thumb: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 10,
    height: 10,
    borderRadius: "50%",
    backgroundColor: colors.surface,
    pointerEvents: "none",
  },
  thumbChecked: { transform: "translateX(12px)", backgroundColor: colors.onFill },
});
