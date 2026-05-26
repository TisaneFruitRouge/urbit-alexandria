import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

declare const process: {
  env: Record<string, string | undefined>;
};

const urbitUrl = process.env.VITE_URBIT_URL ?? "http://localhost";
const shipUrls = parseShipUrls();
const base = process.env.VITE_BASE ?? (process.env.NODE_ENV === "production" ? "/apps/alexandria/" : "/");

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  server: {
    proxy: {
      ...shipProxyRoutes(),
      "/~": {
        target: urbitUrl,
        changeOrigin: true,
      },
      "/apps": {
        target: urbitUrl,
        changeOrigin: true,
      },
      "/alexandria": {
        target: urbitUrl,
        changeOrigin: true,
      },
    },
  },
});

function parseShipUrls() {
  const raw = process.env.VITE_URBIT_SHIP_URLS;
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function shipProxyRoutes() {
  const routes: Record<string, { target: string; changeOrigin: boolean; rewrite: (path: string) => string }> = {};

  for (const ship in shipUrls) {
    const target = shipUrls[ship];
    if (!target) continue;

    const name = ship.replace(/^~/, "");
    const prefix = `/__ship/${name}`;

    routes[prefix] = {
      target,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(prefix, ""),
    };
  }

  return routes;
}
