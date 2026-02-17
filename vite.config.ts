import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const pwaConfig = {
  registerType: "autoUpdate" as const,
  devOptions: {
    enabled: true,
    suppressWarnings: true,
    navigateFallback: "index.html",
  },
  workbox: {
    navigateFallback: "/index.html",
  },
  manifest: {
    name: "Barbaro Nutrition",
    short_name: "Barbaro",
    description: "Barbaro Nutrition: suplementos deportivos premium y asesoría personalizada.",
    theme_color: "#0f172a",
    background_color: "#ffffff",
    display: "standalone" as const,
    start_url: "/",
    scope: "/",
    orientation: "portrait-primary" as const,
    icons: [
      {
        src: "/pwa-icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any" as const,
      },
      {
        src: "/pwa-icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any" as const,
      },
      {
        src: "/pwa-maskable.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable" as const,
      },
    ],
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), VitePWA(pwaConfig), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
