import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    environment: "node",
    exclude: ["**/node_modules/**", "**/dist/**", "**/._*"],
  },
});
