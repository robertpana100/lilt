import { describe, expect, test } from "vitest";
import {
  cloneMusicSessionState,
  createInitialMusicSessionState,
  reduceMusicSessionState,
  updateMusicSessionEffect,
} from "@/audio/playback/session-state";

describe("music session state", () => {
  test("creates and deeply clones a deterministic initial state", () => {
    const initial = createInitialMusicSessionState({ pick: () => 0, randomSeed: () => 42 });
    const clone = cloneMusicSessionState(initial);

    expect(clone).toEqual(initial);
    expect(clone).not.toBe(initial);
    expect(clone.chords).not.toBe(initial.chords);
    expect(clone.rhythmLute).not.toBe(initial.rhythmLute);
    expect(clone.mutedParts).not.toBe(initial.mutedParts);
    expect(clone.effects).not.toBe(initial.effects);
  });

  test("reduces editable concerns without mutating the prior snapshot", () => {
    const initial = createInitialMusicSessionState({ pick: () => 0, randomSeed: () => 7 });
    const rooted = reduceMusicSessionState(initial, { type: "set-root", rootId: "guildhall" });
    const tuned = reduceMusicSessionState(rooted, {
      type: "set-chords",
      patch: { amount: -1, strumMs: 99 },
      pieceIndex: 4,
    });
    const effected = updateMusicSessionEffect(tuned, "tone", { lowGainDb: 99 });

    expect(initial.rootId).toBe("hearth");
    expect(rooted).toMatchObject({
      rootId: "guildhall",
      pieceIndex: 0,
      variationIndex: 0,
      performanceIndex: 0,
      formOverride: null,
      tonicOverride: null,
    });
    expect(tuned).toMatchObject({ pieceIndex: 4, chords: { amount: 0, strumMs: 40 } });
    expect(effected.effects.tone.lowGainDb).toBe(12);
    expect(effected.effects).not.toBe(tuned.effects);
  });
});
