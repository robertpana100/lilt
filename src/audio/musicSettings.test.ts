import { beforeEach, describe, expect, test } from "vitest";
import { DEFAULT_MUSIC_SETTINGS, MUSIC_SETTINGS_STORAGE_KEY, getMusicSettings } from "./musicSettings";
import { reloadMusicSettingsFromStorage } from "@/test/music-settings";

describe("music settings", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadMusicSettingsFromStorage();
  });

  test("starts music for players without a stored preference", () => {
    expect(DEFAULT_MUSIC_SETTINGS).toMatchObject({
      enabled: true,
      volume: 0.35,
      controlMode: "auto",
      favoritesOrder: "shuffle",
    });
  });

  test("defaults an invalid control mode and validates favourites order", () => {
    localStorage.setItem(
      MUSIC_SETTINGS_STORAGE_KEY,
      JSON.stringify({ enabled: false, volume: 0.7, controlMode: "invalid", favoritesOrder: "ordered" }),
    );
    reloadMusicSettingsFromStorage();
    expect(getMusicSettings()).toEqual({
      enabled: false,
      volume: 0.7,
      controlMode: "auto",
      favoritesOrder: "ordered",
      systemMediaControls: true,
    });
  });
});
