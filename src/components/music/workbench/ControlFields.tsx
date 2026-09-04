import { useId, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        type="number"
        disabled={disabled}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(event.target.valueAsNumber)}
      />
    </div>
  );
}

/**
 * A labelled toggle on one bordered row.
 *
 * The row keeps its own minimum height rather than sizing to its text, so a
 * one-line and a two-line toggle sitting together still present the same
 * touch target.
 */
export function SwitchRow({
  label,
  checked,
  disabled,
  ariaLabel,
  onCheckedChange,
}: {
  label: ReactNode;
  checked: boolean;
  disabled?: boolean;
  ariaLabel: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
      <span className="min-w-0">{label}</span>
      <Switch aria-label={ariaLabel} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  );
}
