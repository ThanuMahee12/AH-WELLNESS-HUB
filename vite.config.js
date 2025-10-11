import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - splits large dependencies into separate files
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['react-redux', '@reduxjs/toolkit', 'redux'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-vendor': ['react-bootstrap', 'bootstrap'],
          'charts-vendor': ['recharts'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable'],
          'icons-vendor': ['react-icons/fa']
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000 KB
    sourcemap: false, // Disable source maps for smaller builds
    minify: 'esbuild', // Use esbuild for fast minification
    target: 'es2015' // Support modern browsers
  }
})
