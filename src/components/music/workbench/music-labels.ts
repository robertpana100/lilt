export const noteNames = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

export function midiLabel(note: number): string {
  return `${noteNames[((note % 12) + 12) % 12]}${Math.floor(note / 12) - 1}`;
}
