import { isProceduralLuteWorkletRequest, PROCEDURAL_LUTE_PROCESSOR } from "./procedural-lute-worklet-contract";

declare const AudioWorkletProcessor: {
  new (): {
    readonly port: MessagePort;
  };
};
declare const currentFrame: number;
declare const sampleRate: number;
declare function registerProcessor(
  name: string,
  processorCtor: new (options: { processorOptions?: unknown }) => {
    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
  },
): void;

/**
 * A PCM transfer that loses the race with its scheduled start must resume from
 * the wall-clock position; stepping straight into the ringing course from
 * silence is a broadband crack. Re-entry fades in over a few milliseconds
 * instead, matching the scale of the renderer's own attack window.
 */
export const LATE_ENTRY_FADE_SECONDS = 0.004;

class ProceduralLuteProcessor extends AudioWorkletProcessor {
  private samples: Float32Array | null = null;
  private readonly startFrame: number;
  private readonly fadeFrames: number;
  private readonly valid: boolean;
  private cursor = 0;
  private fadeRemaining = 0;

  constructor(options: { processorOptions?: unknown }) {
    super();
    this.fadeFrames = Math.max(1, Math.round(LATE_ENTRY_FADE_SECONDS * sampleRate));
    if (!isProceduralLuteWorkletRequest(options.processorOptions)) {
      this.startFrame = currentFrame;
      this.valid = false;
      return;
    }
    this.startFrame = Math.max(currentFrame, Math.round(options.processorOptions.startTime * sampleRate));
    this.valid = true;
    this.port.onmessage = (event: MessageEvent<unknown>) => {
      if (typeof event.data !== "object" || event.data === null) return;
      const samples = (event.data as { samples?: unknown }).samples;
      if (samples instanceof ArrayBuffer) this.samples = new Float32Array(samples);
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (!this.valid) return false;
    const output = outputs[0]?.[0];
    if (!output) return true;
    const firstOutputFrame = Math.max(0, this.startFrame - currentFrame);
    if (!this.samples) return true;
    const due = currentFrame - this.startFrame;
    if (due > this.cursor) {
      this.cursor = due;
      this.fadeRemaining = this.fadeFrames;
    }
    for (let outputIndex = firstOutputFrame; outputIndex < output.length; outputIndex += 1) {
      const sample = this.samples[this.cursor];
      if (sample === undefined) return false;
      if (this.fadeRemaining > 0) {
        output[outputIndex] = (sample * (this.fadeFrames - this.fadeRemaining)) / this.fadeFrames;
        this.fadeRemaining -= 1;
      } else {
        output[outputIndex] = sample;
      }
      this.cursor += 1;
    }
    return this.cursor < this.samples.length;
  }
}

registerProcessor(PROCEDURAL_LUTE_PROCESSOR, ProceduralLuteProcessor);
