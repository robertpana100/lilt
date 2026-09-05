import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import { getAppearanceStore, useAppearance } from "./browser";

export function AppearanceControl() {
  const { preference } = useAppearance();
  return (
    <Field label="Appearance" inline compact>
      <Select
        aria-label="Appearance"
        value={preference}
        onChange={(event) => {
          const next = event.currentTarget.value;
          if (next === "light" || next === "dark" || next === "system") getAppearanceStore().setPreference(next);
        }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </Select>
    </Field>
  );
}
