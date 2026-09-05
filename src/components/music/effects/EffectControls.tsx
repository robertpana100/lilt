import * as stylex from "@stylexjs/stylex";
import { styles } from "./styles";
import type { ReactNode } from "react";
import { Switch } from "@/components/ui/Switch";
import { RangeField } from "@/components/ui/RangeField";

export function EffectSlider({
  label,
  ariaLabel,
  value,
  minimum,
  maximum,
  step,
  unit,
  disabled,
  onChange,
}: {
  label: string;
  ariaLabel?: string;
  value: number;
  minimum: number;
  maximum: number;
  step: number;
  unit: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const precision = Number.isInteger(step) ? 0 : step < 0.1 ? 2 : 1;
  return (
    <RangeField
      label={label}
      ariaLabel={ariaLabel ?? label}
      value={value}
      min={minimum}
      max={maximum}
      step={step}
      display={`${value.toFixed(precision)} ${unit}`}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

export function EffectBlock({
  name,
  enabled,
  bypassed,
  onEnabledChange,
  children,
}: {
  name: string;
  enabled: boolean;
  bypassed: boolean;
  onEnabledChange: (enabled: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-label={`${name} effect`} {...stylex.props(styles.effectRow)}>
      <Switch label={name} ariaLabel={name} checked={enabled} disabled={bypassed} onCheckedChange={onEnabledChange} />
      {enabled && !bypassed && <div {...stylex.props(styles.effectParameters)}>{children}</div>}
    </div>
  );
}
