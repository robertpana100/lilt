import { describe, expect, test } from "vitest";
import { createSystemMediaPresence, nearSilentWave } from "@/audio/system-media/presence";

function readText(view: DataView, offset: number, length: number): string {
  return Array.from({ length }, (_, index) => String.fromCharCode(view.getUint8(offset + index))).join("");
}

function fakeElement() {
  return {
    src: "",
    loop: false,
    preload: "none",
    paused: true,
    plays: 0,
    pauses: 0,
    play() {
      this.plays += 1;
      this.paused = false;
      return Promise.resolve();
    },
    pause() {
      this.pauses += 1;
      this.paused = true;
    },
  };
}

describe("system media presence", () => {
  test("writes a playable mono PCM wave the length it claims", () => {
    const buffer = nearSilentWave(8000, 1);
    const view = new DataView(buffer);

    expect(readText(view, 0, 4)).toBe("RIFF");
    expect(readText(view, 8, 4)).toBe("WAVE");
    expect(view.getUint32(4, true)).toBe(buffer.byteLength - 8);
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(8000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(8000 * 2);
    expect(buffer.byteLength).toBe(44 + 8000 * 2);
  });

  test("carries an audio track that is inaudible rather than absent", () => {
    const view = new DataView(nearSilentWave(64, 1));
    const samples = Array.from({ length: 64 }, (_, frame) => view.getInt16(44 + frame * 2, true));

    expect(new Set(samples)).toEqual(new Set([1, -1]));
  });

  test("claims and releases one looping element", () => {
    const element = fakeElement();
    const presence = createSystemMediaPresence({
      createElement: () => element as unknown as HTMLAudioElement,
      createSourceUrl: () => "blob:silence",
      revokeSourceUrl: () => undefined,
    });

    presence.claim();
    expect(element).toMatchObject({ src: "blob:silence", loop: true, plays: 1 });

    presence.claim();
    expect(element.plays).toBe(1);

    presence.release();
    expect(element.pauses).toBe(1);
    presence.claim();
    expect(element.plays).toBe(2);
  });

  test("a refused play is left for the next sounding piece", () => {
    const element = { ...fakeElement(), play: () => Promise.reject(new Error("gesture required")) };
    const presence = createSystemMediaPresence({
      createElement: () => element as unknown as HTMLAudioElement,
      createSourceUrl: () => "blob:silence",
      revokeSourceUrl: () => undefined,
    });

    expect(() => presence.claim()).not.toThrow();
  });

  test("disposing revokes the source it created", () => {
    const revoked: string[] = [];
    const element = fakeElement();
    const presence = createSystemMediaPresence({
      createElement: () => element as unknown as HTMLAudioElement,
      createSourceUrl: () => "blob:silence",
      revokeSourceUrl: (url) => revoked.push(url),
    });

    presence.claim();
    presence.dispose();

    expect(revoked).toEqual(["blob:silence"]);
    expect(element.pauses).toBe(1);
  });
});
