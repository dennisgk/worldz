import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import wasm from "vite-plugin-wasm";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wasm()],
  server: {
    host: "0.0.0.0",
    port: 5173
  },
  build: {
    target: "esnext"
  }
});
