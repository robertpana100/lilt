import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import { setMusicControlMode, type MusicSettings } from "@/audio/musicSettings";

export function MusicDirectionControls({ settings }: { settings: MusicSettings }) {
  return (
    <Field label="Direction" inline>
      <Select
        aria-label="Music direction"
        value={settings.controlMode}
        onChange={(event) => {
          const value = event.currentTarget.value;
          if (value === "auto" || value === "override") setMusicControlMode(value);
        }}
      >
        <option value="auto">Automatic</option>
        <option value="override">Manual</option>
      </Select>
    </Field>
  );
}
