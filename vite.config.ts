import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/multi-stop-pathfinder-03/', // <-- IMPORTANT for GitHub Project Pages
  server: {
    port: 8080
  }
})
