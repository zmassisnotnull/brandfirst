import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Group major libraries into separate chunks
            if (id.includes('@mui')) return 'vendor-mui'
            if (id.includes('@radix-ui')) return 'vendor-radix'
            if (id.includes('fabric')) return 'vendor-fabric'
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react'
            // Put the rest of node_modules in a generic catch-all
            return 'vendor'
          }
        }
      }
    }
  }
})
