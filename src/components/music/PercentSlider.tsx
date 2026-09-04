import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider, sliderValue } from "@/components/ui/slider";

interface PercentSliderProps {
  label: string;
  ariaLabel?: string;
  value: number;
  /** The largest value the control may set; defaults to the full 0–1 range. */
  maximum?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

/** A labelled nought-to-one control, read out as a percentage. */
export function PercentSlider({
  label,
  ariaLabel,
  value,
  maximum = 1,
  disabled = false,
  onChange,
}: PercentSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <Label>{label}</Label>
        <Badge variant="outline">{Math.round(value * 100)}%</Badge>
      </div>
      <Slider
        aria-label={ariaLabel ?? label}
        min={0}
        max={maximum * 100}
        step={1}
        value={[value * 100]}
        disabled={disabled}
        onValueChange={(next) => onChange(sliderValue(next) / 100)}
      />
    </div>
  );
}
