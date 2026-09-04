import type { LuteStyleId, LuteTechnique } from "../composition/lute";
import { mixMusicSeed } from "../composition/random";
import type { MusicSynth } from "./synth";

const CHORD_PAN_WIDTH = 0.08;

/** Coordinated course scheduling shared by generated music and audition. */
export function playLuteVoicing(
  synth: MusicSynth,
  style: LuteStyleId,
  pitches: readonly number[],
  time: number,
  duration: number,
  level: number,
  strumMs: number,
  seed: number,
  bus: AudioNode | null,
  performance: {
    technique: LuteTechnique;
    panCenter: number;
    panWidth: number;
  } = { technique: "melody", panCenter: 0, panWidth: CHORD_PAN_WIDTH },
): void {
  const courses = [...pitches].sort((left, right) => left - right);
  const strumSeconds = strumMs / 1_000;
  const courseLevel = (level * (courses.length === 1 ? 1 : 1.12)) / Math.sqrt(courses.length);
  courses.forEach((pitch, courseIndex) => {
    const strumOffset = courseIndex * strumSeconds;
    const courseDuration = duration - strumOffset;
    if (courseDuration <= 0) return;
    const pan =
      courses.length === 1
        ? performance.panCenter
        : performance.panCenter -
          performance.panWidth / 2 +
          (performance.panWidth * courseIndex) / (courses.length - 1);
    synth.playLute(
      style,
      performance.technique,
      pitch,
      time + strumOffset,
      courseDuration,
      courseLevel,
      pan,
      mixMusicSeed(seed, courseIndex, pitch),
      bus,
    );
  });
}
