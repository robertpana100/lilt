import { TavernMusicEngine, type TavernMusicEngineOptions } from "./engine";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((complete, fail) => {
    resolve = complete;
    reject = fail;
  });
  return { promise, resolve, reject };
}

export function fakeAudioContext(options: { deferResume?: boolean } = {}) {
  let state: AudioContextState = "suspended";
  let currentTime = 0;
  const resumeGate = options.deferResume ? deferred<void>() : null;
  const gains: Array<{ node: GainNode; starts: number[] }> = [];
  const targetValues: number[] = [];

  const parameter = (starts?: number[]): AudioParam => {
    const result = {
      value: 0,
      cancelScheduledValues: () => result,
      setTargetAtTime: (value: number) => {
        result.value = value;
        targetValues.push(value);
        return result;
      },
      setValueAtTime: (value: number, time: number) => {
        result.value = value;
        starts?.push(time);
        return result;
      },
      exponentialRampToValueAtTime: (value: number) => {
        result.value = value;
        return result;
      },
      linearRampToValueAtTime: (value: number) => {
        result.value = value;
        return result;
      },
    };
    return result as unknown as AudioParam;
  };
  const node = (): AudioNode => {
    const result = {
      connect: (destination: AudioNode) => destination,
      disconnect: () => undefined,
    };
    return result as unknown as AudioNode;
  };
  const gain = (): GainNode => {
    const starts: number[] = [];
    const result = {
      connect: (destination: AudioNode) => destination,
      disconnect: () => undefined,
      gain: parameter(starts),
    } as unknown as GainNode;
    gains.push({ node: result, starts });
    return result;
  };
  const buffer = (numberOfChannels: number, length: number, sampleRate: number): AudioBuffer => {
    const channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
    return {
      numberOfChannels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: (channel: number) => channels[channel],
      copyToChannel: (source: Float32Array<ArrayBufferLike>, channel: number) => channels[channel]!.set(source),
    } as unknown as AudioBuffer;
  };
  const destination = node();
  const context = {
    get state() {
      return state;
    },
    get currentTime() {
      return currentTime;
    },
    sampleRate: 20,
    destination,
    resume: async () => {
      if (resumeGate) await resumeGate.promise;
      state = "running";
    },
    suspend: async () => {
      state = "suspended";
    },
    close: async () => {
      state = "closed";
    },
    createGain: gain,
    createBuffer: buffer,
    createDelay: () =>
      ({
        connect: (target: AudioNode | AudioParam) => target,
        disconnect: () => undefined,
        delayTime: parameter(),
      }) as unknown as DelayNode,
    createOscillator: () =>
      ({
        connect: (target: AudioNode | AudioParam) => target,
        disconnect: () => undefined,
        frequency: parameter(),
        start: () => undefined,
        stop: () => undefined,
      }) as unknown as OscillatorNode,
    createBiquadFilter: () =>
      ({
        connect: (target: AudioNode) => target,
        disconnect: () => undefined,
        type: "lowpass",
        frequency: parameter(),
        gain: parameter(),
      }) as unknown as BiquadFilterNode,
    createWaveShaper: () =>
      ({
        connect: (target: AudioNode) => target,
        disconnect: () => undefined,
        curve: null,
        oversample: "none",
      }) as unknown as WaveShaperNode,
    createConvolver: () =>
      ({
        connect: (target: AudioNode) => target,
        disconnect: () => undefined,
        buffer: null,
      }) as unknown as ConvolverNode,
    createDynamicsCompressor: () =>
      ({
        connect: (target: AudioNode) => target,
        disconnect: () => undefined,
        threshold: parameter(),
        knee: parameter(),
        ratio: parameter(),
        attack: parameter(),
        release: parameter(),
      }) as unknown as DynamicsCompressorNode,
    createBufferSource: () =>
      ({
        connect: (target: AudioNode) => target,
        disconnect: () => undefined,
        buffer: null,
        loop: false,
        loopStart: 0,
        loopEnd: 0,
        detune: parameter(),
        start: () => undefined,
        stop: () => undefined,
      }) as unknown as AudioBufferSourceNode,
    createStereoPanner: () =>
      ({
        connect: (target: AudioNode) => target,
        disconnect: () => undefined,
        pan: parameter(),
      }) as unknown as StereoPannerNode,
  } as unknown as AudioContext;

  return {
    context,
    gains,
    targetValues,
    setCurrentTime(value: number) {
      currentTime = value;
    },
    releaseResume() {
      resumeGate?.resolve();
    },
    rejectResume(reason?: unknown) {
      resumeGate?.reject(reason);
    },
  };
}

export function fakeTimers() {
  type IntervalHandle = ReturnType<typeof setInterval>;
  type TimeoutHandle = ReturnType<typeof setTimeout>;
  let nextHandle = 0;
  const intervals = new Map<IntervalHandle, { callback: () => void; delay: number }>();
  const timeouts = new Map<TimeoutHandle, { callback: () => void; delay: number }>();
  const scheduleInterval: NonNullable<TavernMusicEngineOptions["scheduleInterval"]> = (callback, delay) => {
    const handle = ++nextHandle as unknown as IntervalHandle;
    intervals.set(handle, { callback, delay });
    return handle;
  };
  const scheduleTimeout: NonNullable<TavernMusicEngineOptions["scheduleTimeout"]> = (callback, delay) => {
    const handle = ++nextHandle as unknown as TimeoutHandle;
    timeouts.set(handle, { callback, delay });
    return handle;
  };
  return {
    intervals,
    timeouts,
    scheduleInterval,
    cancelInterval: (handle: IntervalHandle) => {
      intervals.delete(handle);
    },
    scheduleTimeout,
    cancelTimeout: (handle: TimeoutHandle) => {
      timeouts.delete(handle);
    },
    runTimeout(delay: number) {
      const match = [...timeouts].find(([, entry]) => entry.delay === delay);
      if (!match) throw new Error(`No ${delay}ms timeout was scheduled`);
      timeouts.delete(match[0]);
      match[1].callback();
    },
  };
}

export async function flushMusicPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

export async function tickScheduler(
  audio: ReturnType<typeof fakeAudioContext>,
  timers: ReturnType<typeof fakeTimers>,
  secondsElapsed: number,
): Promise<void> {
  audio.setCurrentTime(audio.context.currentTime + secondsElapsed);
  [...timers.intervals.values()][0]!.callback();
  await flushMusicPromises();
}

/** Runs the score clock to the current piece's written end, opening its gap. */
export async function runToPieceEnd(
  engine: TavernMusicEngine,
  audio: ReturnType<typeof fakeAudioContext>,
  timers: ReturnType<typeof fakeTimers>,
): Promise<void> {
  await tickScheduler(audio, timers, engine.getRuntimeSnapshot().durationSeconds + 1);
}

/** Lets the authored gap elapse so whatever follows can be activated. */
export async function runThroughGap(
  engine: TavernMusicEngine,
  audio: ReturnType<typeof fakeAudioContext>,
  timers: ReturnType<typeof fakeTimers>,
): Promise<void> {
  await tickScheduler(audio, timers, engine.getRuntimeSnapshot().gapSeconds + 1);
  await flushMusicPromises();
}

export function readyEngine(
  audio: ReturnType<typeof fakeAudioContext>,
  timers: ReturnType<typeof fakeTimers>,
  overrides: Partial<TavernMusicEngineOptions> = {},
): TavernMusicEngine {
  return new TavernMusicEngine({
    createAudioContext: () => audio.context,
    ...timers,
    ...overrides,
  });
}
