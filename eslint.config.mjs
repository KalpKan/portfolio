import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Evidence copies of other repos' tests and scripts, kept for the reports; not hub source.
    "docs/**",
    // Other agents' git worktrees (each a full checkout with its own node_modules).
    ".worktrees/**",
  ]),
]);

export default eslintConfig;
