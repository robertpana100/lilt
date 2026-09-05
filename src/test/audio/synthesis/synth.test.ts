import { afterEach, describe, expect, test, vi } from "vitest";
import { MusicSynth } from "@/audio/synthesis/synth";
import { PROCEDURAL_LUTE_PROCESSOR } from "@/audio/synthesis/procedural-lute-worklet-contract";

function fakeContext(addModule: () => Promise<void>) {
  const createBuffer = vi.fn((numberOfChannels: number, length: number, sampleRate: number) => {
    const channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
    return {
      duration: length / sampleRate,
      getChannelData: (channel: number) => channels[channel],
    } as unknown as AudioBuffer;
  });
  const parameter = () =>
    ({
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    }) as unknown as AudioParam;
  const node = () =>
    ({
      connect: vi.fn((destination: AudioNode) => destination),
      disconnect: vi.fn(),
    }) as unknown as AudioNode;
  const createGain = vi.fn(() => ({ ...node(), gain: parameter() }) as GainNode);
  const createStereoPanner = vi.fn(() => ({ ...node(), pan: { value: 0 } }) as StereoPannerNode);
  const createBufferSource = vi.fn(
    () =>
      ({
        ...node(),
        buffer: null,
        start: vi.fn(),
        stop: vi.fn(),
      }) as unknown as AudioBufferSourceNode,
  );
  const context = {
    sampleRate: 12_000,
    audioWorklet: { addModule: vi.fn(addModule) },
    createBuffer,
    createBufferSource,
    createGain,
    createStereoPanner,
  } as unknown as AudioContext;
  return { context, createBuffer };
}

describe("music synth worklet", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("schedules procedural requests without allocating native audio buffers", async () => {
    const context = fakeContext(async () => undefined);
    const nodes: Array<{ name: string; options: AudioWorkletNodeOptions }> = [];
    const nodePorts: Array<{ postMessage: ReturnType<typeof vi.fn> }> = [];
    const workerMessages: unknown[] = [];
    const workers: FakeWorker[] = [];
    class FakeWorker {
      onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;

      constructor() {
        workers.push(this);
      }

      postMessage(message: unknown): void {
        workerMessages.push(message);
      }

      terminate(): void {}
    }
    class FakeAudioWorkletNode {
      readonly port = { postMessage: vi.fn() };

      constructor(_context: BaseAudioContext, name: string, options: AudioWorkletNodeOptions) {
        nodes.push({ name, options });
        nodePorts.push(this.port);
      }

      connect(destination: AudioNode): AudioNode {
        return destination;
      }
    }
    vi.stubGlobal("Worker", FakeWorker);
    vi.stubGlobal("AudioWorkletNode", FakeAudioWorkletNode);
    const synth = new MusicSynth(context.context, {} as AudioNode);

    await synth.prepare();
    synth.playLute("renaissance-lute", "melody", 57, 1.5, 0.4, 0.2, 0, 42, null);

    expect(context.context.audioWorklet.addModule).toHaveBeenCalledOnce();
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      name: PROCEDURAL_LUTE_PROCESSOR,
      options: {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        processorOptions: {
          kind: "course",
          startTime: 1.5,
          options: { midi: 57, seed: 42 },
        },
      },
    });
    expect(workerMessages).toEqual([
      expect.objectContaining({
        id: 1,
        request: expect.objectContaining({ kind: "course", startTime: 1.5 }),
      }),
    ]);
    const samples = new Float32Array([0.1, -0.1]).buffer;
    workers[0]?.onmessage?.({ data: { id: 1, samples } } as MessageEvent);
    expect(nodePorts[0]?.postMessage).toHaveBeenCalledWith({ samples }, [samples]);
    expect(context.createBuffer).not.toHaveBeenCalled();

    workers[0]?.onerror?.({} as ErrorEvent);
    synth.playLute("oud", "melody", 57, 2, 0.5, 0.2, 0, 9, null);
    expect(context.createBuffer).toHaveBeenCalledOnce();
  });

  test("falls back deterministically when a host cannot load the worklet", async () => {
    const context = fakeContext(async () => {
      throw new Error("unsupported");
    });
    vi.stubGlobal("AudioWorkletNode", class {});
    const synth = new MusicSynth(context.context, {} as AudioNode);

    await expect(synth.prepare()).resolves.toBeUndefined();
    synth.playLute("oud", "melody", 57, 0, 0.5, 0.2, 0, 9, null);

    expect(context.createBuffer).toHaveBeenCalledOnce();
  });

  test("does not create a render worker when disposed during worklet loading", async () => {
    let finishLoading: (() => void) | undefined;
    const context = fakeContext(
      () =>
        new Promise<void>((resolve) => {
          finishLoading = resolve;
        }),
    );
    const workers: unknown[] = [];
    vi.stubGlobal(
      "Worker",
      class {
        constructor() {
          workers.push(this);
        }
      },
    );
    vi.stubGlobal("AudioWorkletNode", class {});
    const synth = new MusicSynth(context.context, {} as AudioNode);

    const preparation = synth.prepare();
    synth.dispose();
    finishLoading?.();
    await preparation;

    expect(workers).toHaveLength(0);
  });
});
