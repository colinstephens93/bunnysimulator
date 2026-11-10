import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.BASE_PATH || '/bunnysimulator/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split large libraries into their own long-cacheable files so app
        // updates only re-download the small app chunk.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/three/')) return 'three'
          if (id.includes('postprocessing') || id.includes('n8ao')) return 'postfx'
          if (id.includes('@react-three') || id.includes('three-stdlib') || id.includes('camera-controls') || id.includes('troika')) return 'r3f'
          if (id.includes('react')) return 'react'
        }
      }
    }
  }
})
