// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://sophiaollerschmid.com", // TODO: dominio real
  output: "static",
  trailingSlash: "always",
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
