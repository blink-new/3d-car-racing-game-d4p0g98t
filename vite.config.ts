import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    watch: {
      usePolling: true,
    },
    hmr: {
      // Using auto detection for HMR
      protocol: 'wss',
      clientPort: 443,
      // Don't specify host to let Vite auto-detect it
      timeout: 120000
    },
    allowedHosts: ['.blink.new']
  },
  preview: {
    port: 3000,
    strictPort: true,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
})