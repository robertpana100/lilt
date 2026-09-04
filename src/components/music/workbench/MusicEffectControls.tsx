import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider, sliderValue } from "@/components/ui/slider";
import { SwitchRow } from "./ControlFields";

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
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <Label>{label}</Label>
        <Badge variant="outline">
          {Number.isInteger(step) ? value.toFixed(0) : value.toFixed(step < 0.1 ? 2 : 1)} {unit}
        </Badge>
      </div>
      <Slider
        aria-label={ariaLabel ?? `Music effect ${label}`}
        min={minimum}
        max={maximum}
        step={step}
        value={[value]}
        disabled={disabled}
        onValueChange={(next) => onChange(sliderValue(next))}
      />
    </div>
  );
}

export function MusicEffectBlock({
  name,
  description,
  enabled,
  bypassed,
  onEnabledChange,
  children,
}: {
  name: string;
  description: string;
  enabled: boolean;
  bypassed: boolean;
  onEnabledChange: (enabled: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-label={`${name} effect`} className="space-y-3 rounded-lg border p-3">
      <SwitchRow
        ariaLabel={`Enable music ${name}`}
        label={<span className="text-xs font-medium">{name}</span>}
        hint={description}
        checked={enabled}
        disabled={bypassed}
        onCheckedChange={onEnabledChange}
      />
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}
