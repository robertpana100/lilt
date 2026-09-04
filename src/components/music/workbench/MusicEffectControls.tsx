import type { ReactNode } from "react";
import { CheckboxField, RangeField } from "./ControlFields";

export function MusicEffectSlider({
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
      ariaLabel={ariaLabel ?? `Music effect ${label}`}
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

export function MusicEffectBlock({
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
    <div role="group" aria-label={`${name} effect`} className="effect-row">
      <CheckboxField
        label={name}
        ariaLabel={`Enable music ${name}`}
        checked={enabled}
        disabled={bypassed}
        onCheckedChange={onEnabledChange}
      />
      {enabled && !bypassed && <div className="effect-parameters">{children}</div>}
    </div>
  );
}
