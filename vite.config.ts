import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cesium()],
  optimizeDeps: {
    include: [
      'maplibre-gl',
      'cesium',
      '@cesium-suite/cesium-flight-simulator',
      'react-redux',
      '@reduxjs/toolkit',
    ],
  },
  resolve: {
    alias: [{ find: /^maplibre-gl$/, replacement: 'maplibre-gl/dist/maplibre-gl.js' }],
  },
})
