import { setMusicControlMode, type MusicSettings } from "@/audio/musicSettings";

export function MusicDirectionControls({ settings }: { settings: MusicSettings }) {
  return (
    <label className="inline-field">
      Direction
      <select
        aria-label="Music direction"
        value={settings.controlMode}
        onChange={(event) => {
          const value = event.currentTarget.value;
          if (value === "auto" || value === "override") setMusicControlMode(value);
        }}
      >
        <option value="auto">Automatic</option>
        <option value="override">Manual</option>
      </select>
    </label>
  );
}
