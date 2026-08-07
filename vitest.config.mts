import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    /* O que importa testar no V1 é lógica pura — não precisa de DOM. */
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/features/**/domain/**", "src/lib/format.ts"],
      reporter: ["text", "html"],
    },
  },
});
