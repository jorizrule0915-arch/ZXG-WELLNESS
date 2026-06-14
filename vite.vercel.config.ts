import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    port: 8080,
    host: true,
    proxy: {
      "/api": {
        target: "https://www.zxgwellness.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: "dist/vercel",
    emptyOutDir: true,
  },
});
