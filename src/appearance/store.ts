export type AppearancePreference = "system" | "light" | "dark";
export type Appearance = "light" | "dark";
export interface AppearanceSnapshot {
  preference: AppearancePreference;
  resolved: Appearance;
}
export interface AppearanceHost {
  read(): string | null;
  write(preference: AppearancePreference): void;
  systemIsDark(): boolean;
  apply(appearance: Appearance): void;
  onSystemChange(listener: () => void): () => void;
  onStorageChange(listener: () => void): () => void;
}
export function appearancePreference(value: unknown): AppearancePreference {
  return value === "light" || value === "dark" ? value : "system";
}
export function createAppearanceStore(host: AppearanceHost) {
  const read = () => {
    try {
      return appearancePreference(host.read());
    } catch {
      return "system" as const;
    }
  };
  const resolve = (preference: AppearancePreference): Appearance =>
    preference === "system" ? (host.systemIsDark() ? "dark" : "light") : preference;
  let preference = read();
  let snapshot: AppearanceSnapshot = { preference, resolved: resolve(preference) };
  const listeners = new Set<() => void>();
  let detach: (() => void) | null = null;
  const refresh = () => {
    const resolved = resolve(preference);
    host.apply(resolved);
    if (snapshot.preference === preference && snapshot.resolved === resolved) return;
    snapshot = { preference, resolved };
    listeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => snapshot,
    initialize: refresh,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) {
        const stopSystem = host.onSystemChange(refresh);
        const stopStorage = host.onStorageChange(() => {
          preference = read();
          refresh();
        });
        detach = () => {
          stopSystem();
          stopStorage();
        };
        refresh();
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          detach?.();
          detach = null;
        }
      };
    },
    setPreference(next: AppearancePreference) {
      preference = next;
      try {
        host.write(next);
      } catch {
        /* Keep the selection for this session. */
      }
      refresh();
    },
  };
}
