import { MODE_INTERVALS, type MusicCadencePattern, type MusicMode, type MusicRoot } from "./roots";

export function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function weightedInterval(root: MusicRoot, random: () => number): number {
  const total = root.style.melodicIntervals.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = random() * total;
  for (const entry of root.style.melodicIntervals) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.steps;
  }
  return 0;
}

export function scaleNote(mode: MusicMode, tonic: number, degree: number, octaveOffset = 0): number {
  const scale = MODE_INTERVALS[mode];
  const wrapped = ((degree % scale.length) + scale.length) % scale.length;
  const octaves = Math.floor(degree / scale.length);
  const interval = scale[wrapped];
  if (interval === undefined) throw new Error(`Mode ${mode} has no interval at ${wrapped}.`);
  return tonic + interval + (octaves + octaveOffset) * 12;
}

function fitToRange(note: number, [minimum, maximum]: readonly [number, number]): number {
  let fitted = note;
  while (fitted < minimum) fitted += 12;
  while (fitted > maximum) fitted -= 12;
  // A range narrower than an octave cannot hold every pitch class; the fold
  // can then land outside, so clamp it back inside.
  return Math.min(maximum, Math.max(minimum, fitted));
}

export function fitToRangeNear(note: number, range: readonly [number, number], previous: number | null): number {
  if (previous === null) return fitToRange(note, range);
  const candidates: number[] = [];
  for (let octave = -4; octave <= 4; octave += 1) {
    const candidate = note + octave * 12;
    if (candidate >= range[0] && candidate <= range[1]) {
      candidates.push(candidate);
    }
  }
  if (candidates.length === 0) return fitToRange(note, range);
  return candidates.reduce((closest, candidate) =>
    Math.abs(candidate - previous) < Math.abs(closest - previous) ? candidate : closest,
  );
}

export function cadencePitches(root: MusicRoot, tonicMidi: number, cadence: MusicCadencePattern): number[] {
  const pitches: number[] = [];
  let nextPitch: number | null = null;
  for (const degree of [...cadence.degrees].reverse()) {
    const pitch = fitToRangeNear(scaleNote(root.mode, tonicMidi, degree, 1), root.style.melodyRange, nextPitch);
    pitches.unshift(pitch);
    nextPitch = pitch;
  }
  return pitches;
}

export function modalBridgePitches(
  root: MusicRoot,
  tonicMidi: number,
  from: number,
  to: number,
  maximum: number,
): number[] {
  if (maximum <= 0 || Math.abs(to - from) <= 4) return [];
  const lower = Math.min(from, to);
  const upper = Math.max(from, to);
  const between = Array.from({ length: 36 }, (_, index) => scaleNote(root.mode, tonicMidi, index - 14))
    .filter((pitch, index, pitches) => pitch > lower && pitch < upper && pitches.indexOf(pitch) === index)
    .sort((left, right) => (from < to ? left - right : right - left));
  const count = Math.min(maximum, between.length);
  return Array.from({ length: count }, (_, index) => {
    const selection = between[Math.floor(((index + 1) * (between.length + 1)) / (count + 1)) - 1];
    if (selection === undefined) throw new Error("Modal bridge selection fell outside its candidate range.");
    return selection;
  });
}
