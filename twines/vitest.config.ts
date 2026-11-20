import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          // Repositories run against a SQLite file migrated once per run (see the global setup).
          globalSetup: ["tests/setup/integration-db.ts"],
          env: { DATABASE_URL: "file:./test-integration.db" },
          // All files share one database file, so they must not run concurrently.
          fileParallelism: false,
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "component",
          environment: "jsdom",
          include: ["tests/component/**/*.test.tsx"],
          setupFiles: ["tests/setup/jest-dom.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      // Only the framework-free layers are measured; UI and adapters are covered by
      // component and end-to-end tests instead.
      include: ["src/domain/**", "src/application/**"],
      // Thresholds are always enforced. They do not fail while those folders are still empty
      // because there is nothing to measure (the report is 0 of 0 and does not fail), and they
      // start gating as soon as the first domain or application file lands.
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
