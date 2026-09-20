import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["**/*.test.{ts,tsx}"],
    // docs/reports/evidence holds test files copied from other repos as evidence;
    // they import modules that do not exist here and are not hub tests.
    exclude: ["**/node_modules/**", "**/.next/**", "docs/**", ".worktrees/**"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
});
