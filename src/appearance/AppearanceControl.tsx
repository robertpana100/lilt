import { getAppearanceStore, useAppearance } from "./browser";

export function AppearanceControl() {
  const { preference } = useAppearance();
  return (
    <label className="inline-field appearance-control">
      Appearance
      <select
        value={preference}
        onChange={(event) => {
          const next = event.currentTarget.value;
          if (next === "light" || next === "dark" || next === "system") getAppearanceStore().setPreference(next);
        }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
