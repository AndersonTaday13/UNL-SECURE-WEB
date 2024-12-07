import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background.js"),
        main: resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: "[name].js",
        format: "es",
      },
    },
    outDir: "dist",
  },
});
