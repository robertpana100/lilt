import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import { setMusicControlMode, type MusicSettings } from "@/audio/musicSettings";

export function MusicDirectionControls({ settings }: { settings: MusicSettings }) {
  return (
    <Field label="Direction" inline>
      <Select
        aria-label="Music direction"
        value={settings.controlMode}
        onValueChange={(value) => {
          if (value === "auto" || value === "override") setMusicControlMode(value);
        }}
        options={[
          { value: "auto", label: "Automatic" },
          { value: "override", label: "Manual" },
        ]}
      />
    </Field>
  );
}
