import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/fixnest-[hash].js`,
        chunkFileNames: `assets/fixnest-[hash].js`,
        assetFileNames: `assets/fixnest-[hash].[ext]`
      }
    }
  }
})
