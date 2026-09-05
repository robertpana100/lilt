import { useId } from "react";
import * as stylex from "@stylexjs/stylex";
import { colors, space } from "./tokens.stylex";
import { Slider } from "./Slider";

export function RangeField({
  label,
  ariaLabel,
  value,
  min = 0,
  max = 100,
  step = 1,
  display,
  disabled,
  onChange,
}: {
  label: string;
  ariaLabel?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  display: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div {...stylex.props(styles.field)}>
      <div {...stylex.props(styles.heading)}>
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} {...stylex.props(styles.value)}>
          {display}
        </output>
      </div>
      <Slider
        id={id}
        aria-label={ariaLabel}
        aria-valuetext={display}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
    </div>
  );
}

const styles = stylex.create({
  field: { minWidth: 0 },
  heading: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: space.sm, fontSize: 12 },
  value: { color: colors.muted, fontSize: 11, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" },
});
