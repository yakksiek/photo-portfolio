// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import sanity from "@sanity/astro";

const loadedEnv = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

// Public, non-secret project coordinates. Defaults are this project's real
// values (also in src/sanity/env.ts); override via PUBLIC_SANITY_* env vars.
const projectId = loadedEnv.PUBLIC_SANITY_PROJECT_ID ?? "bp1ecwdp";
const dataset = loadedEnv.PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = loadedEnv.PUBLIC_SANITY_API_VERSION ?? "2025-01-01";

// https://astro.build/config
export default defineConfig({
  output: "server",
  // react() must come before sanity() — the embedded Studio is a React app.
  integrations: [
    react(),
    sitemap(),
    sanity({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      studioBasePath: "/admin",
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare(),
});
