import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import stylex from "@stylexjs/unplugin";
import { stylexOptions } from "./stylex.config.ts";
export default defineConfig({
  // Compile real styles without the Vite adapter's HTTP/HMR lifecycle in DOM tests.
  plugins: [stylex.rollup({ ...stylexOptions, dev: false })],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/test/**/*.test.{ts,tsx}"], setupFiles: ["./src/test/register-dom.ts"], testTimeout: 30_000 },
});
