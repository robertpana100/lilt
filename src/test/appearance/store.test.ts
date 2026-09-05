import { describe, expect, test, vi } from "vitest";
import { createAppearanceStore, type AppearanceHost } from "@/appearance/store";
function environment(preference: string | null = null, dark = false) {
  let onSystem = () => {};
  let onStorage = () => {};
  const stopSystem = vi.fn();
  const stopStorage = vi.fn();
  const host: AppearanceHost = {
    read: () => preference,
    write: (next) => {
      preference = next;
    },
    systemIsDark: () => dark,
    apply: vi.fn(),
    onSystemChange: (listener) => {
      onSystem = listener;
      return stopSystem;
    },
    onStorageChange: (listener) => {
      onStorage = listener;
      return stopStorage;
    },
  };
  return {
    host,
    stopSystem,
    stopStorage,
    system(next: boolean) {
      dark = next;
      onSystem();
    },
    storage(next: string | null) {
      preference = next;
      onStorage();
    },
  };
}
describe("appearance preferences", () => {
  test("follows system appearance until an explicit mode is selected", () => {
    const env = environment(null, true);
    const store = createAppearanceStore(env.host);
    store.subscribe(() => {});
    expect(store.getSnapshot()).toEqual({ preference: "system", resolved: "dark" });
    env.system(false);
    expect(store.getSnapshot().resolved).toBe("light");
    store.setPreference("dark");
    expect(env.host.read()).toBe("dark");
    env.system(false);
    expect(store.getSnapshot()).toEqual({ preference: "dark", resolved: "dark" });
    store.setPreference("system");
    expect(store.getSnapshot().resolved).toBe("light");
  });
  test("restores saved appearance and responds to changes from another tab", () => {
    const env = environment("dark");
    const store = createAppearanceStore(env.host);
    store.initialize();
    expect(env.host.apply).toHaveBeenLastCalledWith("dark");
    store.subscribe(() => {});
    env.storage("light");
    expect(store.getSnapshot()).toEqual({ preference: "light", resolved: "light" });
    env.system(true);
    env.storage(null);
    expect(store.getSnapshot()).toEqual({ preference: "system", resolved: "dark" });
  });
  test("retains the selection when browser storage is unavailable", () => {
    const env = environment(null, true);
    env.host.read = () => {
      throw new Error("Storage blocked");
    };
    env.host.write = () => {
      throw new Error("Storage blocked");
    };
    const store = createAppearanceStore(env.host);
    store.subscribe(() => {});
    store.setPreference("light");
    env.system(true);
    expect(store.getSnapshot()).toEqual({ preference: "light", resolved: "light" });
    expect(env.host.apply).toHaveBeenLastCalledWith("light");
  });
  test("shares observers and detaches only after the last subscriber", () => {
    const env = environment("invalid");
    const store = createAppearanceStore(env.host);
    const listener = vi.fn();
    const first = store.subscribe(listener);
    const second = store.subscribe(() => {});
    const initial = store.getSnapshot();
    env.system(false);
    expect(store.getSnapshot()).toBe(initial);
    expect(listener).not.toHaveBeenCalled();
    first();
    expect(env.stopSystem).not.toHaveBeenCalled();
    second();
    expect(env.stopSystem).toHaveBeenCalledOnce();
    expect(env.stopStorage).toHaveBeenCalledOnce();
  });
});
