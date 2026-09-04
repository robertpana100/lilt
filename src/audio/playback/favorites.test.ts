import { describe, expect, test } from "vitest";
import { FavoritePlaybackQueue } from "./favorites";
import type { MusicReplayTrack } from "./replay";

function track(id: string): MusicReplayTrack {
  return { id, name: id, recipe: {} as MusicReplayTrack["recipe"] };
}

describe("favourites playback queue", () => {
  test("plays ordered favourites from oldest to newest and loops", () => {
    const queue = new FavoritePlaybackQueue(() => 0);
    const favorites = [track("oldest"), track("middle"), track("newest")];
    expect(queue.first(favorites, "ordered")?.id).toBe("oldest");
    expect(queue.next(favorites, "ordered", "oldest")?.id).toBe("middle");
    expect(queue.next(favorites, "ordered", "middle")?.id).toBe("newest");
    expect(queue.next(favorites, "ordered", "newest")?.id).toBe("oldest");
  });

  test("continues after a requested favourite in ordered mode", () => {
    const queue = new FavoritePlaybackQueue(() => 0);
    const favorites = [track("a"), track("b"), track("c")];
    expect(queue.first(favorites, "ordered", "b")?.id).toBe("b");
    expect(queue.next(favorites, "ordered", "b")?.id).toBe("c");
  });

  test("uses every shuffled favourite before reshuffling without an immediate repeat", () => {
    const queue = new FavoritePlaybackQueue(() => 0);
    const favorites = [track("a"), track("b"), track("c")];
    const first = queue.first(favorites, "shuffle")!;
    const second = queue.next(favorites, "shuffle", first.id)!;
    const third = queue.next(favorites, "shuffle", second.id)!;
    const fourth = queue.next(favorites, "shuffle", third.id)!;
    expect(new Set([first.id, second.id, third.id])).toEqual(new Set(["a", "b", "c"]));
    expect(fourth.id).not.toBe(third.id);
  });

  test("reconciles removals and reports an empty library", () => {
    const queue = new FavoritePlaybackQueue(() => 0);
    const favorites = [track("a"), track("b")];
    queue.first(favorites, "ordered", "b");
    expect(queue.next([track("a")], "ordered", "b")?.id).toBe("a");
    expect(queue.next([], "shuffle", "a")).toBeNull();
  });
});
