import { defineConfig } from "@vscode/test-cli";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  files: "dist/tests/extension/**/*.test.js",
  extensionDevelopmentPath: resolve(__dirname, "."),
  mocha: {
    ui: "tdd",
    timeout: 20000,
  },
});
