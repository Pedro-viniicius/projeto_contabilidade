import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    /*
     * Continua em `node`: o que precisa de proteção é lógica pura e a
     * camada de persistência, e esta é testada com um `localStorage`
     * falso — que permite simular cota estourada e armazenamento
     * bloqueado, coisa que um DOM real não permite. Sem dependência
     * nova de ambiente.
     */
    environment: "node",
    /* `.tsx` incluído: antes um teste de componente simplesmente não
       era encontrado — não falhava, não rodava, não avisava. */
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      /* Cobertura acompanha o risco operacional, não uma meta de
         percentual: além do domínio, a persistência e os schemas. */
      include: [
        "src/features/**/domain/**",
        "src/features/**/schemas/**",
        "src/features/**/services/**",
        "src/lib/format.ts",
        "src/lib/storage.ts",
      ],
      reporter: ["text", "html"],
    },
  },
});
