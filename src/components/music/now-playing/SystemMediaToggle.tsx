import { setMusicSystemMediaControls } from "@/audio/musicSettings";
import { CheckboxField } from "../workbench/ControlFields";
export function SystemMediaToggle({ enabled }: { enabled: boolean }) {
  return (
    <CheckboxField
      label="Media keys"
      ariaLabel="Show music in system controls"
      checked={enabled}
      onCheckedChange={setMusicSystemMediaControls}
    />
  );
}
