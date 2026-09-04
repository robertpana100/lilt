import { createMusicRandom, mixMusicSeed } from "../composition/random";
import type { LuteStyleId, LuteTechnique } from "../composition/lute";

interface LutePhysicalProfile {
  courseDetuneCents: number;
  dampingSeconds: number;
  brightness: number;
  excitationBrightness: number;
  pluckPosition: number;
  bodyFrequencies: readonly [number, number];
  bodyAmount: number;
}

const PHYSICAL_PROFILES: Readonly<Record<LuteStyleId, LutePhysicalProfile>> = {
  "renaissance-lute": {
    courseDetuneCents: 1.4,
    dampingSeconds: 5.2,
    brightness: 0.68,
    excitationBrightness: 0.74,
    pluckPosition: 0.22,
    bodyFrequencies: [188, 372],
    bodyAmount: 0.18,
  },
  gittern: {
    courseDetuneCents: 2.2,
    dampingSeconds: 4.2,
    brightness: 0.82,
    excitationBrightness: 0.86,
    pluckPosition: 0.17,
    bodyFrequencies: [226, 448],
    bodyAmount: 0.14,
  },
  oud: {
    courseDetuneCents: 1.8,
    dampingSeconds: 5.8,
    brightness: 0.58,
    excitationBrightness: 0.66,
    pluckPosition: 0.27,
    bodyFrequencies: [164, 326],
    bodyAmount: 0.22,
  },
};

const TECHNIQUE_TONE: Readonly<Record<LuteTechnique, number>> = {
  melody: 1,
  rhythm: 0.82,
  // Sustained support wants the darkest, slowest-decaying courses of the three.
  drone: 0.72,
};

export interface LuteCourseRenderOptions {
  style: LuteStyleId;
  technique: LuteTechnique;
  midi: number;
  sampleRate: number;
  durationSeconds: number;
  seed: number;
}

function midiFrequency(midi: number, cents = 0): number {
  return 440 * 2 ** ((midi - 69 + cents / 100) / 12);
}

function normalize(samples: Float32Array, ceiling = 0.92): Float32Array {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (peak === 0) return samples;
  const scale = ceiling / peak;
  for (let index = 0; index < samples.length; index += 1) samples[index] = (samples[index] ?? 0) * scale;
  return samples;
}

/**
 * One deterministic extended Karplus–Strong string. The excitation is combed
 * at the virtual plucking point, then recirculated through a lossy low-pass.
 * This is an original implementation of the published algorithm, not source
 * derived from the unlicensed JavaScript reference project.
 */
function renderString(
  frequency: number,
  sampleRate: number,
  length: number,
  profile: LutePhysicalProfile,
  tone: number,
  seed: number,
  samples: Float32Array = new Float32Array(length),
  workspace?: StringRenderWorkspace,
): Float32Array {
  // The two-point loop filter contributes roughly half a sample of delay.
  const delayLength = Math.max(2, Math.round(sampleRate / frequency - 0.5));
  const delay = workspace ? resizeBuffer(workspace.delay, delayLength) : new Float32Array(delayLength);
  const noise = workspace ? resizeBuffer(workspace.noise, delayLength) : new Float32Array(delayLength);
  if (workspace) {
    workspace.delay = delay;
    workspace.noise = noise;
  }
  const activeDelay = delay.subarray(0, delayLength);
  const activeNoise = noise.subarray(0, delayLength);
  const random = createMusicRandom(seed);
  let roundedNoise = 0;
  for (let index = 0; index < delayLength; index += 1) {
    const rawNoise = random() * 2 - 1;
    roundedNoise += (rawNoise - roundedNoise) * profile.excitationBrightness;
    activeNoise[index] = roundedNoise;
  }

  const pluckOffset = Math.max(1, Math.round(delayLength * profile.pluckPosition));
  for (let index = 0; index < delayLength; index += 1) {
    activeDelay[index] = (activeNoise[index] ?? 0) - (activeNoise[(index + pluckOffset) % delayLength] ?? 0) * 0.52;
  }

  const activeSamples = samples.subarray(0, length);
  const brightness = Math.min(0.96, Math.max(0.08, profile.brightness * tone));
  const decaySeconds = profile.dampingSeconds * (0.72 + 0.38 * tone);
  const loopGain = 0.01 ** (delayLength / (Math.max(0.2, decaySeconds) * sampleRate));
  let previousFiltered = 0;
  for (let index = 0; index < length; index += 1) {
    const cursor = index % delayLength;
    const current = activeDelay[cursor] ?? 0;
    const neighbor = activeDelay[(cursor + 1) % delayLength] ?? 0;
    const averaged = (current + neighbor) * 0.5;
    const filtered = brightness * averaged + (1 - brightness) * previousFiltered;
    activeDelay[cursor] = filtered * loopGain;
    previousFiltered = filtered;
    const attack = Math.min(1, index / Math.max(1, sampleRate * 0.0035));
    activeSamples[index] = current * attack;
  }
  return activeSamples;
}

interface StringRenderWorkspace {
  delay: Float32Array;
  noise: Float32Array;
}

function resizeBuffer(buffer: Float32Array, minimumLength: number): Float32Array {
  return buffer.length >= minimumLength ? buffer : new Float32Array(minimumLength);
}

function courseLength(options: LuteCourseRenderOptions): number {
  return Math.max(1, Math.ceil(Math.max(0.08, options.durationSeconds) * options.sampleRate));
}

function renderLuteCourseInto(
  options: LuteCourseRenderOptions,
  firstBuffer: Float32Array,
  secondBuffer: Float32Array,
  workspaces?: readonly [StringRenderWorkspace, StringRenderWorkspace],
): Float32Array {
  const profile = PHYSICAL_PROFILES[options.style];
  const tone = TECHNIQUE_TONE[options.technique];
  const length = courseLength(options);
  const first = renderString(
    midiFrequency(options.midi, -profile.courseDetuneCents / 2),
    options.sampleRate,
    length,
    profile,
    tone,
    mixMusicSeed(options.seed, 0, 0x434f5552),
    firstBuffer,
    workspaces?.[0],
  );
  const second = renderString(
    midiFrequency(options.midi, profile.courseDetuneCents / 2),
    options.sampleRate,
    length,
    profile,
    tone * 0.96,
    mixMusicSeed(options.seed, 1, 0x434f5552),
    secondBuffer,
    workspaces?.[1],
  );
  for (let index = 0; index < length; index += 1) {
    first[index] = (first[index] ?? 0) * 0.58 + (second[index] ?? 0) * 0.42;
  }
  addBodyResonance(first, options.sampleRate, profile);
  return normalize(first);
}

function addBodyResonance(samples: Float32Array, sampleRate: number, profile: LutePhysicalProfile): void {
  for (const [resonanceIndex, frequency] of profile.bodyFrequencies.entries()) {
    const amount = profile.bodyAmount * (resonanceIndex === 0 ? 1 : 0.62);
    const radius = resonanceIndex === 0 ? 0.992 : 0.987;
    const coefficient = 2 * radius * Math.cos((2 * Math.PI * frequency) / sampleRate);
    const radiusSquared = radius * radius;
    let previous = 0;
    let previousPrevious = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const sample = samples[index] ?? 0;
      const resonated = sample * (1 - radius) + coefficient * previous - radiusSquared * previousPrevious;
      samples[index] = sample + resonated * amount;
      previousPrevious = previous;
      previous = resonated;
    }
  }
}

/**
 * Reuses the renderer's PCM and delay-line storage across scheduled notes.
 * Callers must consume or copy each returned view before the next render.
 */
export class ProceduralLuteRenderPool {
  private firstCourse: Float32Array<ArrayBufferLike> = new Float32Array(0);
  private secondCourse: Float32Array<ArrayBufferLike> = new Float32Array(0);
  private readonly stringWorkspaces: [StringRenderWorkspace, StringRenderWorkspace] = [
    { delay: new Float32Array(0), noise: new Float32Array(0) },
    { delay: new Float32Array(0), noise: new Float32Array(0) },
  ];

  renderCourse(options: LuteCourseRenderOptions): Float32Array {
    const length = courseLength(options);
    this.firstCourse = resizeBuffer(this.firstCourse, length);
    this.secondCourse = resizeBuffer(this.secondCourse, length);
    return renderLuteCourseInto(options, this.firstCourse, this.secondCourse, this.stringWorkspaces);
  }
}
