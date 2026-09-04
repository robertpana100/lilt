import { useSyncExternalStore } from "react";

export interface MusicSettings {
  enabled: boolean;
  volume: number;
  controlMode: "auto" | "override";
}

export const MUSIC_SETTINGS_STORAGE_KEY = "lilt-music";
export const DEFAULT_MUSIC_SETTINGS: MusicSettings = {
  enabled: false,
  volume: 0.35,
  controlMode: "auto",
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
      controlMode: stored?.controlMode === "override" ? "override" : "auto",
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

export function useMusicSettings(): MusicSettings {
  return useSyncExternalStore(subscribeMusicSettings, getMusicSettings, () => DEFAULT_MUSIC_SETTINGS);
}
