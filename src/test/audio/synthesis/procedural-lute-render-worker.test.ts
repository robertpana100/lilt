import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { ProceduralLuteWorkerResponse } from "@/audio/synthesis/procedural-lute-worklet-contract";

const responses: ProceduralLuteWorkerResponse[] = [];
const worker = {
  onmessage: null as ((event: { data: unknown }) => void) | null,
  postMessage(message: ProceduralLuteWorkerResponse, transfer: Transferable[]) {
    // Detach transferred buffers as a real worker does, including across pooled renders.
    responses.push(structuredClone(message, { transfer }));
  },
};
const options = {
  style: "renaissance-lute",
  technique: "melody",
  midi: 57,
  sampleRate: 48_000,
  durationSeconds: 0.1,
  seed: 42,
};

beforeAll(async () => {
  vi.stubGlobal("self", worker);
  await import("@/audio/synthesis/procedural-lute-render-worker");
});
beforeEach(() => {
  responses.length = 0;
});
afterAll(() => vi.unstubAllGlobals());

describe("render worker messages", () => {
  test.each([44_100, 48_000])("transfers audible PCM and reuses its renderer at %i Hz", (sampleRate) => {
    const request = { kind: "course", startTime: 0, options: { ...options, sampleRate } };
    worker.onmessage!({ data: { id: 1, request } });
    worker.onmessage!({ data: { id: 2, request } });

    expect(responses).toHaveLength(2);
    const first = responses[0]!;
    const second = responses[1]!;
    expect(first.id).toBe(1);
    expect(second.id).toBe(2);
    if (!("samples" in first) || !("samples" in second)) throw new Error("Worker failed to render PCM");
    const samples = new Float32Array(first.samples);
    expect(samples).toHaveLength(sampleRate * options.durationSeconds);
    expect(samples.every(Number.isFinite)).toBe(true);
    expect(samples.some((sample) => Math.abs(sample) > 0.1)).toBe(true);
    expect(new Float32Array(second.samples)).toEqual(samples);
  });

  test("reports a failed render and accepts the next request", () => {
    const request = { kind: "course", startTime: 0, options };
    worker.onmessage!({ data: { id: 1, request: { ...request, options: { ...options, style: "missing" } } } });
    worker.onmessage!({ data: { id: 2, request } });

    expect(responses).toEqual([
      { id: 1, error: expect.any(String) },
      { id: 2, samples: expect.any(ArrayBuffer) },
    ]);
  });
});
