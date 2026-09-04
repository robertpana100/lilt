/** Stable integer mixing keeps independent random streams from influencing one another. */
export function mixMusicSeed(seed: number, ...values: number[]): number {
  let mixed = (seed ^ 0x811c9dc5) >>> 0;
  for (const value of values) {
    mixed ^= value >>> 0;
    mixed = Math.imul(mixed, 0x01000193) >>> 0;
    mixed ^= mixed >>> 13;
    mixed = Math.imul(mixed, 0x85ebca6b) >>> 0;
  }
  return (mixed ^ (mixed >>> 16)) >>> 0;
}

export function createMusicRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function pickMusicValue<T>(values: readonly T[], random: () => number): T {
  const selected = values[Math.min(values.length - 1, Math.floor(random() * values.length))];
  if (selected === undefined) throw new Error("Cannot pick from an empty music collection.");
  return selected;
}
