const noteNames = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

export function noteName(note: number): string {
  return noteNames[((note % 12) + 12) % 12]!;
}
