import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/club-registration-platform/",
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5050",
    },
  },
});
