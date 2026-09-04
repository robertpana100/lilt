import { useSyncExternalStore } from "react";
export type NotificationTone = "warning" | "success" | "info" | "error";
interface Notice {
  tone: NotificationTone;
  message: string;
}
let notice: Notice | null = null;
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function notify(tone: NotificationTone, message: string): void {
  notice = { tone, message };
  listeners.forEach((listener) => listener());
}
export function dismissNotification(): void {
  notice = null;
  listeners.forEach((listener) => listener());
}
export function useNotification() {
  return useSyncExternalStore(
    subscribe,
    () => notice,
    () => null,
  );
}
