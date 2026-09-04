import { describe, expect, test } from "vitest";
import { MUSIC_ROOTS, getMusicRoot, type MusicRootId } from "./roots";

describe("music roots", () => {
  test("resolves every defined root by id", () => {
    for (const root of MUSIC_ROOTS) expect(getMusicRoot(root.id)).toBe(root);
  });

  test("rejects ids that bypass closed-union validation", () => {
    expect(() => getMusicRoot("unknown" as MusicRootId)).toThrow("Unknown music root: unknown");
  });
});
