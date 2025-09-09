// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/",                        // important for SPA routing on Vercel
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // "./src" is also fine
    },
  },
  build: {
    // make sure nothing is externalized by accident
    rollupOptions: {
      external: [],                 // keep empty
    },
  },
});
