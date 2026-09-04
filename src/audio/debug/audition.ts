import { LUTE_STYLES, MODE_INTERVALS, type LuteStyleId, type MusicMode } from "../composition/roots";
import { DEFAULT_MUSIC_EFFECTS, type MusicEffectsConfig } from "../synthesis/effects/config";
import type { MusicEffectRack } from "../synthesis/effects/rack";
import { playLuteVoicing } from "../synthesis/lute-performance";
import { createMusicAudioGraph, MusicSynth } from "../synthesis/synth";

/** A standalone ear-check for each procedural lute voice. */
export type AuditionMode = "note" | "phrase";
export type AuditionChordVoicing = "single" | "fifth-dyad" | "open-fifth" | "modal-triad";

const AUDITION_LEVEL = 0.11;
const PHRASE_STEP_SECONDS = 0.28;
/** First click may still be loading the render worker; give its PCM time to
 * arrive before the first note is due. */
const AUDITION_LEAD_SECONDS = 0.3;
export const PHRASE_DEGREES = [0, 3, 7, 10, 12, 10, 7, 0] as const;

export const AUDITION_CHORD_VOICINGS: ReadonlyArray<{
  id: AuditionChordVoicing;
  name: string;
}> = [
  { id: "single", name: "Single" },
  { id: "fifth-dyad", name: "Fifth dyad" },
  { id: "open-fifth", name: "Open fifth" },
  { id: "modal-triad", name: "Modal triad" },
];

export interface AuditionVoice {
  id: LuteStyleId;
  name: string;
  style: LuteStyleId;
  pitch: number;
}

export const AUDITION_VOICES: readonly AuditionVoice[] = LUTE_STYLES.map((style) => ({
  id: style.id,
  name: style.name,
  style: style.id,
  pitch: style.id === "gittern" ? 62 : 57,
}));

interface AuditionEngine {
  context: AudioContext;
  synth: MusicSynth;
  analyser: AnalyserNode;
  effects: MusicEffectRack;
}

let engine: AuditionEngine | null = null;
let suspendTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleIdleSuspend(soundSeconds: number): void {
  if (suspendTimer !== null) clearTimeout(suspendTimer);
  suspendTimer = setTimeout(
    () => {
      suspendTimer = null;
      if (engine && engine.context.state === "running") void engine.context.suspend();
    },
    (soundSeconds + 1.5) * 1_000,
  );
}

export function suspendAuditionEngine(): void {
  if (suspendTimer !== null) clearTimeout(suspendTimer);
  suspendTimer = null;
  if (engine && engine.context.state === "running") void engine.context.suspend();
}

function ensureEngine(effectConfig: Readonly<MusicEffectsConfig>): AuditionEngine | null {
  if (engine) {
    engine.effects.update(effectConfig);
    return engine;
  }
  if (typeof window === "undefined" || !window.AudioContext) return null;
  const context = new window.AudioContext();
  const { master, input, effects } = createMusicAudioGraph(context, 0.5, effectConfig);
  const analyser = context.createAnalyser();
  analyser.fftSize = 2_048;
  analyser.smoothingTimeConstant = 0.72;
  master.connect(analyser);
  const synth = new MusicSynth(context, input);
  engine = { context, synth, analyser, effects };
  return engine;
}

export function getAuditionAnalyser(): AnalyserNode | null {
  return engine?.analyser ?? null;
}

export async function auditionVoice(
  voice: AuditionVoice,
  mode: AuditionMode,
  effects: Readonly<MusicEffectsConfig> = DEFAULT_MUSIC_EFFECTS,
): Promise<void> {
  const active = ensureEngine(effects);
  if (!active) return;
  try {
    await active.context.resume();
    await active.synth.prepare();
  } catch {
    return;
  }
  const start = active.context.currentTime + AUDITION_LEAD_SECONDS;
  if (mode === "note") {
    active.synth.playLute(voice.style, "melody", voice.pitch, start, 1.8, AUDITION_LEVEL, 0, 0x61756410, null);
    scheduleIdleSuspend(1.8);
    return;
  }
  PHRASE_DEGREES.forEach((degree, index) => {
    const last = index === PHRASE_DEGREES.length - 1;
    active.synth.playLute(
      voice.style,
      "melody",
      voice.pitch + degree,
      start + index * PHRASE_STEP_SECONDS,
      last ? 1.4 : PHRASE_STEP_SECONDS,
      AUDITION_LEVEL,
      0,
      0x61756420 + index,
      null,
    );
  });
  scheduleIdleSuspend((PHRASE_DEGREES.length - 1) * PHRASE_STEP_SECONDS + 1.4);
}

export function auditionChordPitches(
  rootPitch: number,
  mode: MusicMode,
  voicing: AuditionChordVoicing,
): readonly number[] {
  if (voicing === "single") return [rootPitch];
  if (voicing === "fifth-dyad") return [rootPitch, rootPitch + 7];
  if (voicing === "open-fifth") return [rootPitch, rootPitch + 7, rootPitch + 12];
  const modalThird = MODE_INTERVALS[mode][2];
  if (modalThird === undefined) throw new Error(`Mode ${mode} has no modal third.`);
  return [rootPitch, rootPitch + modalThird, rootPitch + 7];
}

export async function auditionChord(
  voice: AuditionVoice,
  rootPitch: number,
  mode: MusicMode,
  voicing: AuditionChordVoicing,
  strumMs: number,
  effects: Readonly<MusicEffectsConfig> = DEFAULT_MUSIC_EFFECTS,
): Promise<void> {
  const active = ensureEngine(effects);
  if (!active) return;
  try {
    await active.context.resume();
    await active.synth.prepare();
  } catch {
    return;
  }
  const pitches = auditionChordPitches(rootPitch, mode, voicing);
  playLuteVoicing(
    active.synth,
    voice.style,
    pitches,
    active.context.currentTime + AUDITION_LEAD_SECONDS,
    2.2,
    0.13,
    strumMs,
    0x61756440,
    null,
  );
  scheduleIdleSuspend(2.2);
}
