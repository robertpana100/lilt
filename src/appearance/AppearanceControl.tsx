import { IconSun, IconMoon, IconDeviceDesktop } from "@tabler/icons-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getAppearanceStore, useAppearance } from "./browser";
export function AppearanceControl() {
  const { preference } = useAppearance();
  return (
    <ToggleGroup
      aria-label="Appearance"
      value={[preference]}
      variant="outline"
      size="sm"
      spacing={0}
      onValueChange={(values) => {
        const next = values[0];
        if (next === "light" || next === "dark" || next === "system") getAppearanceStore().setPreference(next);
      }}
    >
      <ToggleGroupItem value="light" aria-label="Light mode" title="Light mode">
        <IconSun />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark mode" title="Dark mode">
        <IconMoon />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label="System theme" title="System theme">
        <IconDeviceDesktop />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
