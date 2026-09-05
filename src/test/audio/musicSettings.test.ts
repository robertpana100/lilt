import { beforeEach, describe, expect, test } from "vitest";
import { DEFAULT_MUSIC_SETTINGS, MUSIC_SETTINGS_STORAGE_KEY, getMusicSettings } from "@/audio/musicSettings";
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
});
