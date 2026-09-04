import type { LuteCourseRenderOptions } from "./procedural-lute";

export const PROCEDURAL_LUTE_PROCESSOR = "lilt-procedural-lute";

export interface ProceduralLuteWorkletRequest {
  kind: "course";
  startTime: number;
  options: LuteCourseRenderOptions;
}

export interface ProceduralLuteWorkerRequest {
  id: number;
  request: ProceduralLuteWorkletRequest;
}

export type ProceduralLuteWorkerResponse = { id: number; samples: ArrayBuffer } | { id: number; error: string };

export function isProceduralLuteWorkletRequest(value: unknown): value is ProceduralLuteWorkletRequest {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { kind?: unknown; startTime?: unknown; options?: unknown };
  return (
    candidate.kind === "course" &&
    typeof candidate.startTime === "number" &&
    Number.isFinite(candidate.startTime) &&
    typeof candidate.options === "object" &&
    candidate.options !== null
  );
}

export function isProceduralLuteWorkerRequest(value: unknown): value is ProceduralLuteWorkerRequest {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { id?: unknown; request?: unknown };
  return Number.isSafeInteger(candidate.id) && isProceduralLuteWorkletRequest(candidate.request);
}

export function isProceduralLuteWorkerResponse(value: unknown): value is ProceduralLuteWorkerResponse {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { id?: unknown; samples?: unknown; error?: unknown };
  return (
    Number.isSafeInteger(candidate.id) &&
    (candidate.samples instanceof ArrayBuffer || typeof candidate.error === "string")
  );
}
