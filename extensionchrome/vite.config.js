import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        content: resolve(__dirname, "src", "content.js"),
        background: resolve(__dirname, "src", "background.js"),
      },
      output: {
        entryFileNames: "[name].js",
        format: "es", // Asegúrate de que la salida sea en formato ES6
      },
    },
  },
});
