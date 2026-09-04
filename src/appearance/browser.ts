import { useSyncExternalStore } from "react";
import { createAppearanceStore, type AppearanceSnapshot } from "./store";
export const APPEARANCE_STORAGE_KEY = "lilt-appearance";
const SERVER_SNAPSHOT: AppearanceSnapshot = { preference: "system", resolved: "light" };
let store: ReturnType<typeof createAppearanceStore> | undefined;
export function getAppearanceStore() {
  if (store) return store;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  store = createAppearanceStore({
    read: () => localStorage.getItem(APPEARANCE_STORAGE_KEY),
    write: (preference) => localStorage.setItem(APPEARANCE_STORAGE_KEY, preference),
    systemIsDark: () => media.matches,
    apply: (appearance) => {
      const root = document.documentElement;
      root.dataset.appearance = appearance;
      root.classList.toggle("dark", appearance === "dark");
      root.style.colorScheme = appearance;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", appearance === "dark" ? "#171717" : "#fafafa");
    },
    onSystemChange: (listener) => {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    },
    onStorageChange: (listener) => {
      const handle = (event: StorageEvent) => {
        if (event.key === null || event.key === APPEARANCE_STORAGE_KEY) listener();
      };
      window.addEventListener("storage", handle);
      return () => window.removeEventListener("storage", handle);
    },
  });
  return store;
}
export function useAppearance() {
  const store = getAppearanceStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => SERVER_SNAPSHOT);
}
