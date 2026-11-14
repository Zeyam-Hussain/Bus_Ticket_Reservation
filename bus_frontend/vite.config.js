import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_API_PROXY_TARGET = 'http://localhost:8080' } = loadEnv(mode, '.', '')

  return {
    base: './',
    plugins: [
      tailwindcss(),
      react(),
    ],
    server: {
      proxy: {
        // Redirects any request starting with /api to the PHP app.
        '/api': {
          target: VITE_API_PROXY_TARGET,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
