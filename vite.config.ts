import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Use environment variable for base path:
  // - Standalone Render: '/' (default)
  // - GameBuddies proxy: '/cluescale/'
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // Remove console logs and debugger statements in production
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'webrtc': ['simple-peer'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
  },
})
