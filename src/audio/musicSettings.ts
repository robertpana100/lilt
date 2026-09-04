import { useSyncExternalStore } from "react";

export interface MusicSettings {
  enabled: boolean;
  volume: number;
  controlMode: "auto" | "override" | "favorites";
  favoritesOrder: "shuffle" | "ordered";
  /**
   * Whether the score appears in the operating system's now-playing surface and
   * answers the hardware media keys. Those keys are shared with every other
   * player on the machine, so this stays a setting rather than a given.
   */
  systemMediaControls: boolean;
}

export const MUSIC_SETTINGS_STORAGE_KEY = "lilt-music";
export const DEFAULT_MUSIC_SETTINGS: MusicSettings = {
  enabled: true,
  volume: 0.35,
  controlMode: "auto",
  favoritesOrder: "shuffle",
  systemMediaControls: true,
};
const listeners = new Set<() => void>();
let snapshot: MusicSettings | null = null;

function loadSettings(): MusicSettings {
  if (snapshot) return snapshot;
  try {
    const stored = JSON.parse(
      localStorage.getItem(MUSIC_SETTINGS_STORAGE_KEY) ?? "null",
    ) as Partial<MusicSettings> | null;
    snapshot = {
      enabled: typeof stored?.enabled === "boolean" ? stored.enabled : DEFAULT_MUSIC_SETTINGS.enabled,
      volume:
        typeof stored?.volume === "number" ? Math.min(1, Math.max(0, stored.volume)) : DEFAULT_MUSIC_SETTINGS.volume,
      controlMode:
        stored?.controlMode === "override" || stored?.controlMode === "favorites" ? stored.controlMode : "auto",
      favoritesOrder: stored?.favoritesOrder === "ordered" ? "ordered" : "shuffle",
      systemMediaControls:
        typeof stored?.systemMediaControls === "boolean"
          ? stored.systemMediaControls
          : DEFAULT_MUSIC_SETTINGS.systemMediaControls,
    };
  } catch {
    snapshot = DEFAULT_MUSIC_SETTINGS;
  }
  return snapshot;
}

function saveSettings(settings: MusicSettings): void {
  snapshot = settings;
  try {
    localStorage.setItem(MUSIC_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Audio still works when storage is unavailable.
  }
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== MUSIC_SETTINGS_STORAGE_KEY) return;
  snapshot = null;
  loadSettings();
  listeners.forEach((listener) => listener());
}

export function subscribeMusicSettings(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

export function getMusicSettings(): MusicSettings {
  return loadSettings();
}

export function setMusicEnabled(enabled: boolean): void {
  saveSettings({ ...loadSettings(), enabled });
}

export function setMusicVolume(volume: number): void {
  saveSettings({ ...loadSettings(), volume: Math.min(1, Math.max(0, volume)) });
}

export function setMusicControlMode(controlMode: MusicSettings["controlMode"]): void {
  saveSettings({ ...loadSettings(), controlMode });
}

export function setMusicFavoritesOrder(favoritesOrder: MusicSettings["favoritesOrder"]): void {
  saveSettings({ ...loadSettings(), favoritesOrder });
}

export function setMusicSystemMediaControls(systemMediaControls: boolean): void {
  saveSettings({ ...loadSettings(), systemMediaControls });
}

export function useMusicSettings(): MusicSettings {
  return useSyncExternalStore(subscribeMusicSettings, getMusicSettings, () => DEFAULT_MUSIC_SETTINGS);
}
