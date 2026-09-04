import { useId, type ReactNode } from "react";

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
    <div className="range-field">
      <div className="field-heading">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{display}</output>
      </div>
      <input
        id={id}
        aria-label={ariaLabel}
        type="range"
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

export function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      {label}
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => {
          if (Number.isFinite(event.currentTarget.valueAsNumber)) onChange(event.currentTarget.valueAsNumber);
        }}
      />
    </label>
  );
}

export function CheckboxField({
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
    <label className="checkbox-field">
      <input
        type="checkbox"
        aria-label={ariaLabel}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.currentTarget.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
