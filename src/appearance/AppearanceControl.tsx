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
        onValueChange={(next) => {
          if (next === "light" || next === "dark" || next === "system") getAppearanceStore().setPreference(next);
        }}
        options={[
          { value: "system", label: "System" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
      />
    </Field>
  );
}
