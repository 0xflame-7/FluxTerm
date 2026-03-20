import { defineConfig } from "vitest/config";

/**
 * Vitest config for pure-Node logic tests (ExecutionEngine etc.)
 * These do NOT depend on vscode or a browser DOM.
 * Run via: pnpm test:engine
 */
export default defineConfig({
  test: {
    name: "engine",
    environment: "node",
    include: ["src/test/**/*.test.ts"],
    // ExecutionEngine spawns real child processes — allow extra time
    testTimeout: 30_000,
  },
});
