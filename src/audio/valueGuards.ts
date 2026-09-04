/**
 * Field guards shared by the persisted-config normalizers. Each feature module
 * still owns its config and its bounds; these only read unknown JSON fields.
 */
export function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function clampedNumber(value: unknown, fallback: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, finiteNumber(value, fallback)));
}

export function booleanField(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function partialObject<T extends object>(value: unknown): Partial<T> {
  return typeof value === "object" && value !== null ? (value as Partial<T>) : {};
}
