import { fileURLToPath } from "node:url";

/** Shared compilation settings for the app and component tests. */
export const stylexOptions = {
  runtimeInjection: false,
  useCSSLayers: { before: ["reset"] },
  aliases: { "@/*": [fileURLToPath(new URL("./src/*", import.meta.url))] },
  unstable_moduleResolution: {
    type: "commonJS" as const,
    rootDir: fileURLToPath(new URL(".", import.meta.url)),
  },
};
