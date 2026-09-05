import { beforeEach, describe, expect, test } from "vitest";
import {
  DEFAULT_MUSIC_SETTINGS,
  MUSIC_SETTINGS_STORAGE_KEY,
  getMusicSettings,
  setMusicVolume,
} from "@/audio/musicSettings";
import { reloadMusicSettingsFromStorage } from "@/test/music-settings";

describe("music settings", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadMusicSettingsFromStorage();
  });

  test("waits for explicit playback for a first-time listener", () => {
    expect(DEFAULT_MUSIC_SETTINGS).toMatchObject({
      enabled: false,
      volume: 0.35,
      controlMode: "auto",
    });
  });

  test.each(["invalid", "favorites"])(
    "falls back to automatic playback for the obsolete or invalid mode %s",
    (controlMode) => {
      localStorage.setItem(
        MUSIC_SETTINGS_STORAGE_KEY,
        JSON.stringify({ enabled: false, volume: 0.7, controlMode, favoritesOrder: "ordered" }),
      );
      reloadMusicSettingsFromStorage();
      expect(getMusicSettings()).toEqual({
        enabled: false,
        volume: 0.7,
        controlMode: "auto",
      });
    },
  );
  test("isolates Lilt preferences from the source game's storage", () => {
    localStorage.setItem("the-city-remembers-music", JSON.stringify({ enabled: true, volume: 0.9 }));
    reloadMusicSettingsFromStorage();
    expect(getMusicSettings()).toEqual(DEFAULT_MUSIC_SETTINGS);
    setMusicVolume(0.42);
    expect(JSON.parse(localStorage.getItem(MUSIC_SETTINGS_STORAGE_KEY)!).volume).toBe(0.42);
    expect(JSON.parse(localStorage.getItem("the-city-remembers-music")!).volume).toBe(0.9);
  });
});
