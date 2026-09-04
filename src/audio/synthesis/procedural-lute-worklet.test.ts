import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { ProceduralLuteRenderPool } from "./procedural-lute";
import { PROCEDURAL_LUTE_PROCESSOR } from "./procedural-lute-worklet-contract";

const QUANTUM = 128;
const SAMPLE_RATE = 12_000;

interface WorkletProcessorHarness {
  readonly port: { onmessage: ((event: { data: unknown }) => void) | null };
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
}

/** The worklet reads these as ambient globals; the harness moves the clock. */
const workletClock = globalThis as unknown as { currentFrame: number };

type WorkletProcessorConstructor = new (options: { processorOptions?: unknown }) => WorkletProcessorHarness;

let Processor: WorkletProcessorConstructor | null = null;
let lateEntryFadeSeconds = 0;

beforeAll(async () => {
  let captured: WorkletProcessorConstructor | null = null;
  vi.stubGlobal("sampleRate", SAMPLE_RATE);
  vi.stubGlobal("currentFrame", 0);
  vi.stubGlobal(
    "AudioWorkletProcessor",
    class {
      readonly port = { onmessage: null };
    },
  );
  vi.stubGlobal("registerProcessor", (name: string, ctor: WorkletProcessorConstructor) => {
    if (name === PROCEDURAL_LUTE_PROCESSOR) captured = ctor;
  });
  const worklet = await import("./procedural-lute-worklet");
  Processor = captured;
  lateEntryFadeSeconds = worklet.LATE_ENTRY_FADE_SECONDS;
});

afterAll(() => vi.unstubAllGlobals());

const COURSE = new ProceduralLuteRenderPool().renderCourse({
  style: "renaissance-lute",
  technique: "melody",
  midi: 57,
  sampleRate: SAMPLE_RATE,
  durationSeconds: 0.4,
  seed: 42,
});

/** Drives the registered processor one render quantum at a time, delivering the
 * PCM transfer only once playback has reached `deliverAtFrame`. */
function runWorklet(startFrame: number, deliverAtFrame: number, samples: Float32Array): Float32Array {
  if (!Processor) throw new Error("worklet processor was not registered");
  workletClock.currentFrame = 0;
  const processor = new Processor({
    processorOptions: { kind: "course", startTime: startFrame / SAMPLE_RATE, options: {} },
  });
  const samplesBuffer = samples.slice().buffer;
  let delivered = false;
  const streamLength = Math.ceil((startFrame + samples.length + QUANTUM * 4) / QUANTUM) * QUANTUM;
  const stream = new Float32Array(streamLength);
  for (let frame = 0; frame < stream.length; frame += QUANTUM) {
    if (!delivered && frame >= deliverAtFrame) {
      processor.port.onmessage?.({ data: { samples: samplesBuffer } });
      delivered = true;
    }
    workletClock.currentFrame = frame;
    const quantum = new Float32Array(QUANTUM);
    if (!processor.process([], [[quantum]])) break;
    stream.set(quantum, frame);
  }
  return stream;
}

describe("procedural lute worklet delivery", () => {
  test("plays the pluck attack from its first sample when PCM arrives before the start frame", () => {
    const startFrame = QUANTUM * 2;
    const stream = runWorklet(startFrame, 0, COURSE);

    for (let index = 0; index < startFrame; index += 1) expect(stream[index]).toBe(0);
    expect(stream[startFrame]).toBe(COURSE[0]);
    // The renderer fades its excitation in over ~3.5 ms, so an on-time note
    // starts from silence rather than stepping into the ringing waveform.
    expect(Math.abs(COURSE[0] ?? 0)).toBeLessThan(0.02);
    const played = stream.slice(startFrame, startFrame + COURSE.length);
    expect(Math.max(...played.map(Math.abs))).toBeCloseTo(0.92, 3);
  });

  test("fades in when PCM arrives after the start frame", () => {
    const startFrame = QUANTUM * 2;
    const entry = startFrame + QUANTUM * 3;
    const entryCursor = QUANTUM * 3;
    // 32 ms late: the render worker or the main-thread relay lost the race
    // with the scheduled start. The note resumes from its wall-clock position,
    // and the re-entry must fade in rather than step into the ringing course.
    const stream = runWorklet(startFrame, entry, COURSE);
    const fadeFrames = Math.round(lateEntryFadeSeconds * SAMPLE_RATE);
    const ringPeak = Math.max(...COURSE.slice(entryCursor).map(Math.abs));

    // The unfixed processor stepped straight into the ring at full amplitude;
    // a fade from silence keeps every early sample a fraction of that peak.
    for (let step = 0; step < fadeFrames; step += 1) {
      const emitted = Math.abs(stream[entry + step] ?? 0);
      expect(emitted).toBeLessThanOrEqual((ringPeak * (step + 1)) / fadeFrames + 1e-6);
    }
    // Once the fade completes the ring itself plays through, sample for sample.
    for (let step = fadeFrames; step < QUANTUM * 2; step += 1) {
      expect(stream[entry + step]).toBe(COURSE[entryCursor + step]);
    }
    const loudest = Math.max(...stream.slice(entry, entry + QUANTUM * 8).map(Math.abs));
    expect(loudest).toBeGreaterThan(0.1);
  });
});
