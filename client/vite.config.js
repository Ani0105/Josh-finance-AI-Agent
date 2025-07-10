
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/add-expense": "http://localhost:3001",
      "/add-income": "http://localhost:3001",
      "/get-balance": "http://localhost:3001",
      "/get-total-expense": "http://localhost:3001",
      "/get-weekly-expense": "http://localhost:3001"
    }
  }
});
