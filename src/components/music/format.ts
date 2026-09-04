import type { MusicRuntimeSnapshot } from "@/audio/playback/types";

export function durationLabel(seconds: number): string {
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

/** What the engine is doing, said in words a player can act on. */
const STATUS_LABELS: Readonly<Record<MusicRuntimeSnapshot["status"], string>> = {
  stopped: "Silent",
  playing: "Playing",
  gap: "Between songs",
  complete: "Finished",
  error: "Audio unavailable",
};

export function musicStatusLabel(status: MusicRuntimeSnapshot["status"]): string {
  return STATUS_LABELS[status];
}
