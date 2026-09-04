import type { MusicPiece } from "../composition/generator";
import { createMusicMidi } from "./midi";

export function musicFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "lilt-song"}.mid`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  // Revoking synchronously can tear the URL down before the browser has begun
  // reading a large blob; the delay only ends the URL's life, not a download
  // already in flight.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function downloadMusicMidi(piece: MusicPiece, title: string): void {
  const bytes = createMusicMidi(piece, title);
  downloadBlob(new Blob([bytes.buffer as ArrayBuffer], { type: "audio/midi" }), musicFilename(title));
}
