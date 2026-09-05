import { RangeField } from "@/components/ui/RangeField";

/** The shared slider backed by a value between zero and one. */
export function PercentSlider({
  label,
  ariaLabel,
  value,
  maximum = 1,
  disabled,
  onChange,
}: {
  label: string;
  ariaLabel?: string;
  value: number;
  maximum?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <RangeField
      label={label}
      ariaLabel={ariaLabel}
      value={value * 100}
      max={maximum * 100}
      display={`${Math.round(value * 100)}%`}
      disabled={disabled}
      onChange={(next) => onChange(next / 100)}
    />
  );
}
