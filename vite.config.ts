import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Assets inside the file:-linked packages (e.g. view-3d's .glb) are
    // fetched as raw /@fs urls, which need an explicit allow entry.
    fs: { allow: ['.', '../mapapp-packages'] },
  },
  optimizeDeps: {
    // Linked workspace packages are plain ESM sources — don't prebundle them,
    // but DO prebundle their CJS deps so they get proper ESM interop.
    exclude: ['@mapapp/map', '@mapapp/network', '@mapapp/layer-manager', '@mapapp/view-3d', '@mapapp/mini-map', '@mapapp/mini-video'],
    include: ['maplibre-gl'],
  },
  resolve: {
    alias: [{ find: /^maplibre-gl$/, replacement: 'maplibre-gl/dist/maplibre-gl.js' }],
    // file:-linked @mapapp/* packages carry their own node_modules — force
    // shared singletons (duplicate React/MobX breaks hooks + observability).
    dedupe: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'mobx',
      'mobx-react-lite',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'maplibre-gl',
      'leaflet',
      'cesium',
      '@deck.gl/core',
      '@deck.gl/layers',
      '@deck.gl/geo-layers',
      '@deck.gl/mesh-layers',
      '@deck.gl/extensions',
      '@luma.gl/core',
      '@luma.gl/engine',
      '@luma.gl/gltf',
      '@luma.gl/shadertools',
      '@luma.gl/webgl',
      '@loaders.gl/core',
      '@loaders.gl/gltf',
      '@math.gl/core',
      '@math.gl/web-mercator',
    ],
  },
})
