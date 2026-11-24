// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import keystatic from "@keystatic/astro";

// El editor (Keystatic, en /keystatic) existe solo en desarrollo local.
// El build publicado sigue siendo 100 % estático y sin JS.
const isDev = process.argv.includes("dev");

export default defineConfig({
  site: "https://tintasophia.github.io",
  // El repo se llama "portfolio" → el sitio vive en /portfolio/. En dev queda en "/" para Keystatic.
  base: isDev ? "/" : "/portfolio",
  output: "static",
  // En dev se relaja: la API de Keystatic usa rutas sin "/" final.
  trailingSlash: isDev ? "ignore" : "always",
  integrations: isDev ? [react(), keystatic()] : [],
  build: {
    format: "directory",
    // Assets separados del HTML: nunca inline.
    inlineStylesheets: "never",
  },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
});
