import { subscribeMusicSettings } from "@/audio/musicSettings";

/** Reloads settings through the same cross-window storage path used at runtime. */
export function reloadMusicSettingsFromStorage(): void {
  const unsubscribe = subscribeMusicSettings(() => {});
  try {
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  } finally {
    unsubscribe();
  }
}
