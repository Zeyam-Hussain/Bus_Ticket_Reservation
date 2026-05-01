import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    proxy: {
      // Redirects any request starting with /api to your PHP folder
      '/api': {
        target: 'http://localhost/bus_backend',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
