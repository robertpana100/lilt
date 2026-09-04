/**
 * The physical character used to voice a score. All three are rendered by the
 * same procedural string model; they change course pairing, damping, body
 * resonance, and plucking position rather than swapping sampled instruments.
 */
export const LUTE_STYLES = [
  {
    id: "renaissance-lute",
    name: "Renaissance lute",
    description: "paired gut courses, a rounded attack, and a small pear-shaped body",
  },
  {
    id: "gittern",
    name: "Gittern",
    description: "a compact medieval body with a brighter, quicker-speaking string",
  },
  {
    id: "oud",
    name: "Oud",
    description: "close-paired courses, a dark body, and a softer fretless attack",
  },
] as const;

export type LuteStyleId = (typeof LUTE_STYLES)[number]["id"];
/** How a part is played: single melody courses, strummed chords, or sustained drone courses. */
export type LuteTechnique = "melody" | "rhythm" | "drone";

export function getLuteStyle(id: LuteStyleId) {
  return LUTE_STYLES.find((style) => style.id === id) ?? LUTE_STYLES[0];
}
