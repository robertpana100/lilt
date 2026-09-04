import { createMusicRandom } from "../../composition/random";
import type {
  ChorusEffectConfig,
  EchoEffectConfig,
  MusicEffectsConfig,
  ReverbEffectConfig,
  SaturationEffectConfig,
  ToneEffectConfig,
  TremoloEffectConfig,
} from "./config";
import { normalizeMusicEffects } from "./config";

interface EffectModule<Config> {
  input: GainNode;
  output: GainNode;
  update(config: Readonly<Config>, bypassed: boolean): void;
  dispose(): void;
}

const ROOM_SEED = 0x726f6f6d;

function smooth(context: AudioContext, parameter: AudioParam, value: number): void {
  parameter.cancelScheduledValues(context.currentTime);
  parameter.setTargetAtTime(value, context.currentTime, 0.015);
}

function dryWet(context: AudioContext, dry: GainNode, wet: GainNode, enabled: boolean, mix: number): void {
  smooth(context, dry.gain, enabled ? Math.cos((mix * Math.PI) / 2) : 1);
  smooth(context, wet.gain, enabled ? Math.sin((mix * Math.PI) / 2) : 0);
}

function moduleShell(context: AudioContext): { input: GainNode; output: GainNode } {
  return { input: context.createGain(), output: context.createGain() };
}

function createChorus(context: AudioContext): EffectModule<ChorusEffectConfig> {
  const { input, output } = moduleShell(context);
  const dry = context.createGain();
  const wet = context.createGain();
  const delay = context.createDelay(0.06);
  const lfo = context.createOscillator();
  const depth = context.createGain();
  input.connect(dry).connect(output);
  input.connect(delay).connect(wet).connect(output);
  lfo.connect(depth).connect(delay.delayTime);
  delay.delayTime.value = 0.012;
  lfo.start();
  return {
    input,
    output,
    update(config, bypassed) {
      const active = config.enabled && !bypassed;
      dryWet(context, dry, wet, active, config.mix);
      smooth(context, lfo.frequency, config.rateHz);
      smooth(context, depth.gain, active ? config.depthMs / 1_000 : 0);
    },
    dispose() {
      lfo.stop();
      input.disconnect();
      output.disconnect();
    },
  };
}

function createEcho(context: AudioContext): EffectModule<EchoEffectConfig> {
  const { input, output } = moduleShell(context);
  const dry = context.createGain();
  const wet = context.createGain();
  const delay = context.createDelay(1);
  const feedback = context.createGain();
  input.connect(dry).connect(output);
  input.connect(delay).connect(wet).connect(output);
  delay.connect(feedback).connect(delay);
  return {
    input,
    output,
    update(config, bypassed) {
      const active = config.enabled && !bypassed;
      dryWet(context, dry, wet, active, config.mix);
      smooth(context, delay.delayTime, config.delaySeconds);
      smooth(context, feedback.gain, active ? config.feedback : 0);
    },
    dispose() {
      input.disconnect();
      output.disconnect();
      delay.disconnect();
      feedback.disconnect();
    },
  };
}

function roomImpulse(context: AudioContext, decaySeconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(context.sampleRate * decaySeconds));
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    const random = createMusicRandom(ROOM_SEED + channel);
    for (let index = 0; index < length; index += 1) {
      data[index] = (random() * 2 - 1) * (1 - index / length) ** 2.8;
    }
  }
  return impulse;
}

function createReverb(context: AudioContext): EffectModule<ReverbEffectConfig> {
  const { input, output } = moduleShell(context);
  const dry = context.createGain();
  const wet = context.createGain();
  const convolver = context.createConvolver();
  let decaySeconds = -1;
  input.connect(dry).connect(output);
  input.connect(convolver).connect(wet).connect(output);
  return {
    input,
    output,
    update(config, bypassed) {
      dryWet(context, dry, wet, config.enabled && !bypassed, config.mix);
      if (config.decaySeconds !== decaySeconds) {
        decaySeconds = config.decaySeconds;
        convolver.buffer = roomImpulse(context, decaySeconds);
      }
    },
    dispose() {
      input.disconnect();
      output.disconnect();
      convolver.disconnect();
    },
  };
}

function createTone(context: AudioContext): EffectModule<ToneEffectConfig> {
  const { input, output } = moduleShell(context);
  const low = context.createBiquadFilter();
  const high = context.createBiquadFilter();
  low.type = "lowshelf";
  low.frequency.value = 260;
  high.type = "highshelf";
  high.frequency.value = 2_600;
  input.connect(low).connect(high).connect(output);
  return {
    input,
    output,
    update(config, bypassed) {
      const active = config.enabled && !bypassed;
      smooth(context, low.gain, active ? config.lowGainDb : 0);
      smooth(context, high.gain, active ? config.highGainDb : 0);
    },
    dispose() {
      input.disconnect();
      output.disconnect();
      low.disconnect();
      high.disconnect();
    },
  };
}

function saturationCurve(drive: number): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(2_048);
  const amount = 1 + drive * 24;
  for (let index = 0; index < curve.length; index += 1) {
    const input = (index / (curve.length - 1)) * 2 - 1;
    curve[index] = Math.tanh(input * amount) / Math.tanh(amount);
  }
  return curve;
}

function createSaturation(context: AudioContext): EffectModule<SaturationEffectConfig> {
  const { input, output } = moduleShell(context);
  const dry = context.createGain();
  const wet = context.createGain();
  const shaper = context.createWaveShaper();
  shaper.oversample = "2x";
  input.connect(dry).connect(output);
  input.connect(shaper).connect(wet).connect(output);
  let drive = -1;
  return {
    input,
    output,
    update(config, bypassed) {
      dryWet(context, dry, wet, config.enabled && !bypassed, config.mix);
      if (config.drive !== drive) {
        drive = config.drive;
        shaper.curve = saturationCurve(drive);
      }
    },
    dispose() {
      input.disconnect();
      output.disconnect();
      shaper.disconnect();
    },
  };
}

function createTremolo(context: AudioContext): EffectModule<TremoloEffectConfig> {
  const { input, output } = moduleShell(context);
  const amplitude = context.createGain();
  const lfo = context.createOscillator();
  const depth = context.createGain();
  input.connect(amplitude).connect(output);
  lfo.connect(depth).connect(amplitude.gain);
  lfo.start();
  return {
    input,
    output,
    update(config, bypassed) {
      const activeDepth = config.enabled && !bypassed ? config.depth : 0;
      smooth(context, amplitude.gain, 1 - activeDepth / 2);
      smooth(context, depth.gain, activeDepth / 2);
      smooth(context, lfo.frequency, config.rateHz);
    },
    dispose() {
      lfo.stop();
      input.disconnect();
      output.disconnect();
    },
  };
}

/** Serial, live-updatable Web Audio rack for music playback. */
export class MusicEffectRack {
  readonly input: GainNode;
  readonly output: GainNode;

  private readonly tone: EffectModule<ToneEffectConfig>;
  private readonly saturation: EffectModule<SaturationEffectConfig>;
  private readonly chorus: EffectModule<ChorusEffectConfig>;
  private readonly tremolo: EffectModule<TremoloEffectConfig>;
  private readonly echo: EffectModule<EchoEffectConfig>;
  private readonly reverb: EffectModule<ReverbEffectConfig>;

  constructor(context: AudioContext, effects: Readonly<MusicEffectsConfig>) {
    this.input = context.createGain();
    this.output = context.createGain();
    this.tone = createTone(context);
    this.saturation = createSaturation(context);
    this.chorus = createChorus(context);
    this.tremolo = createTremolo(context);
    this.echo = createEcho(context);
    this.reverb = createReverb(context);
    this.input.connect(this.tone.input);
    this.tone.output.connect(this.saturation.input);
    this.saturation.output.connect(this.chorus.input);
    this.chorus.output.connect(this.tremolo.input);
    this.tremolo.output.connect(this.echo.input);
    this.echo.output.connect(this.reverb.input);
    this.reverb.output.connect(this.output);
    this.update(effects);
  }

  update(value: Readonly<MusicEffectsConfig>): void {
    const effects = normalizeMusicEffects(value);
    this.tone.update(effects.tone, effects.bypassed);
    this.saturation.update(effects.saturation, effects.bypassed);
    this.chorus.update(effects.chorus, effects.bypassed);
    this.tremolo.update(effects.tremolo, effects.bypassed);
    this.echo.update(effects.echo, effects.bypassed);
    this.reverb.update(effects.reverb, effects.bypassed);
  }

  dispose(): void {
    this.input.disconnect();
    this.output.disconnect();
    this.tone.dispose();
    this.saturation.dispose();
    this.chorus.dispose();
    this.tremolo.dispose();
    this.echo.dispose();
    this.reverb.dispose();
  }
}
