import type { LuteStyleId, LuteTechnique } from "../composition/lute";
import type { MusicPart } from "../composition/roots";
import { ProceduralLuteRenderPool } from "./procedural-lute";
import proceduralLuteRenderWorkerUrl from "./procedural-lute-render-worker.ts?worker&url";
import proceduralLuteWorkletUrl from "./procedural-lute-worklet.ts?worker&url";
import {
  isProceduralLuteWorkerResponse,
  PROCEDURAL_LUTE_PROCESSOR,
  type ProceduralLuteWorkletRequest,
} from "./procedural-lute-worklet-contract";
import { DEFAULT_MUSIC_EFFECTS, type MusicEffectsConfig } from "./effects/config";
import { MusicEffectRack } from "./effects/rack";
import type { MusicChordConfig } from "../composition/chord-config";
import type { MusicRhythmLuteConfig } from "../composition/rhythm-lute-config";

export interface MusicRenderOptions {
  humanization: number;
  chords: Readonly<MusicChordConfig>;
  rhythmLute: Readonly<MusicRhythmLuteConfig>;
  mutedParts: Readonly<Record<MusicPart, boolean>>;
  effects: Readonly<MusicEffectsConfig>;
}

export interface MusicAudioGraph {
  master: GainNode;
  input: GainNode;
  effects: MusicEffectRack;
}

const RELEASE_SECONDS = 0.11;
export const MIN_MUSIC_LUTE_COURSE_SECONDS = 0.08;
export const MAX_MUSIC_LUTE_COURSE_SECONDS = 6.2;

export function createMusicAudioGraph(
  context: AudioContext,
  masterLevel: number,
  effectConfig: Readonly<MusicEffectsConfig> = DEFAULT_MUSIC_EFFECTS,
): MusicAudioGraph {
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  const effects = new MusicEffectRack(context, effectConfig);

  master.gain.value = masterLevel;
  compressor.threshold.value = -16;
  compressor.knee.value = 12;
  compressor.ratio.value = 2.5;
  compressor.attack.value = 0.015;
  compressor.release.value = 0.24;

  effects.output.connect(master);
  master.connect(compressor).connect(context.destination);
  return { master, input: effects.input, effects };
}

/** Web Audio scheduling around worker-rendered procedural lute voices. */
export class MusicSynth {
  private readonly luteRenderer = new ProceduralLuteRenderPool();
  private readonly pendingWorkletRenders = new Map<
    number,
    { node: AudioWorkletNode; request: ProceduralLuteWorkletRequest }
  >();
  private preparePromise: Promise<void> | null = null;
  private renderWorker: Worker | null = null;
  private nextRenderId = 0;
  private disposed = false;
  private workletReady = false;

  constructor(
    private readonly context: AudioContext,
    private readonly output: AudioNode,
  ) {}

  /** Loads the DSP module once for this audio context, retaining the pure
   * TypeScript path only for hosts without AudioWorklet support. */
  prepare(): Promise<void> {
    if (this.disposed) return Promise.resolve();
    this.preparePromise ??= this.prepareWorklet();
    return this.preparePromise;
  }

  dispose(): void {
    this.disposed = true;
    this.renderWorker?.terminate();
    this.renderWorker = null;
    this.pendingWorkletRenders.clear();
    this.workletReady = false;
  }

  playLute(
    style: LuteStyleId,
    technique: LuteTechnique,
    note: number,
    time: number,
    duration: number,
    level: number,
    pan: number,
    seed: number,
    bus: AudioNode | null,
  ): void {
    const soundingSeconds = Math.min(Math.max(MIN_MUSIC_LUTE_COURSE_SECONDS, duration), MAX_MUSIC_LUTE_COURSE_SECONDS);
    const options = {
      style,
      technique,
      midi: note,
      sampleRate: this.context.sampleRate,
      durationSeconds: soundingSeconds,
      seed,
    } as const;
    if (this.workletReady) {
      this.playWorklet({ kind: "course", startTime: time, options }, duration, level, pan, bus);
      return;
    }
    const samples = this.luteRenderer.renderCourse(options);
    this.playBuffer(samples, time, duration, level, pan, bus);
  }

  private async prepareWorklet(): Promise<void> {
    try {
      const worklet = this.context.audioWorklet;
      if (!worklet || typeof AudioWorkletNode !== "function" || typeof Worker !== "function") return;
      await worklet.addModule(proceduralLuteWorkletUrl);
      if (this.disposed) return;
      const worker = new Worker(proceduralLuteRenderWorkerUrl, { type: "module" });
      worker.onmessage = this.receiveWorkerRender;
      worker.onerror = this.handleWorkerFailure;
      this.renderWorker = worker;
      this.workletReady = true;
    } catch {
      // Older embedded webviews and restrictive hosts retain the deterministic
      // synchronous renderer instead of losing music entirely.
    }
  }

  private playWorklet(
    request: ProceduralLuteWorkletRequest,
    duration: number,
    level: number,
    pan: number,
    bus: AudioNode | null,
  ): void {
    const source = new AudioWorkletNode(this.context, PROCEDURAL_LUTE_PROCESSOR, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: request,
    });
    this.scheduleSource(source, request.startTime, duration, level, pan, bus);
    const worker = this.renderWorker;
    if (!worker) {
      this.sendFallbackRender(source, request);
      return;
    }
    const id = ++this.nextRenderId;
    this.pendingWorkletRenders.set(id, { node: source, request });
    try {
      worker.postMessage({ id, request });
    } catch {
      this.pendingWorkletRenders.delete(id);
      this.sendFallbackRender(source, request);
    }
  }

  private readonly receiveWorkerRender = (event: MessageEvent<unknown>): void => {
    if (!isProceduralLuteWorkerResponse(event.data)) return;
    const pending = this.pendingWorkletRenders.get(event.data.id);
    if (!pending) return;
    this.pendingWorkletRenders.delete(event.data.id);
    if ("samples" in event.data) {
      pending.node.port.postMessage({ samples: event.data.samples }, [event.data.samples]);
      return;
    }
    this.sendFallbackRender(pending.node, pending.request);
  };

  private readonly handleWorkerFailure = (): void => {
    this.renderWorker?.terminate();
    this.renderWorker = null;
    this.workletReady = false;
    for (const { node, request } of this.pendingWorkletRenders.values()) {
      this.sendFallbackRender(node, request);
    }
    this.pendingWorkletRenders.clear();
  };

  private sendFallbackRender(node: AudioWorkletNode, request: ProceduralLuteWorkletRequest): void {
    const pooled = this.luteRenderer.renderCourse(request.options);
    const samples = pooled.slice().buffer;
    node.port.postMessage({ samples }, [samples]);
  }

  private playBuffer(
    samples: Float32Array,
    time: number,
    duration: number,
    level: number,
    pan: number,
    bus: AudioNode | null,
  ): void {
    const buffer = this.context.createBuffer(1, samples.length, this.context.sampleRate);
    buffer.getChannelData(0).set(samples);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    this.scheduleSource(source, time, duration, level, pan, bus);
    source.start(time);
    source.stop(Math.min(time + duration, time + buffer.duration) + 0.01);
  }

  private scheduleSource(
    source: AudioNode,
    time: number,
    duration: number,
    level: number,
    pan: number,
    bus: AudioNode | null,
  ): void {
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    gain.gain.value = level;
    panner.pan.value = pan;
    source.connect(gain).connect(panner);
    this.connectOutput(panner, bus);
    const end = time + duration;
    const releaseSeconds = Math.min(RELEASE_SECONDS, Math.max(0.008, duration * 0.22));
    const releaseAt = Math.max(time, end - releaseSeconds);
    gain.gain.setValueAtTime(level, releaseAt);
    gain.gain.linearRampToValueAtTime(0.0001, end);
  }

  private connectOutput(output: AudioNode, bus: AudioNode | null): void {
    if (bus) {
      output.connect(bus);
      return;
    }
    output.connect(this.output);
  }
}
