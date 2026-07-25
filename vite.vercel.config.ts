import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET || env.ZXG_API_PROXY_TARGET || "https://www.zxgwellness.com";
  const devPort = Number(process.env.PORT || env.PORT || 8080);

  return {
    plugins: [
      TanStackRouterVite({
        routesDirectory: "./src/routes",
        generatedRouteTree: "./src/routeTree.gen.ts",
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
      tsconfigPaths(),
    ],
    server: {
      port: devPort,
      host: true,
      proxy:
        apiProxyTarget.toLowerCase() === "disabled"
          ? undefined
          : {
              "/api": {
                target: apiProxyTarget,
                changeOrigin: true,
                secure: !apiProxyTarget.startsWith("http://localhost"),
              },
            },
    },
    build: {
      outDir: "dist/vercel",
      emptyOutDir: true,
    },
  };
});
