import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm'],
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/')

          if (normalized.includes('node_modules')) {
            if (normalized.includes('@duckdb')) {
              return undefined
            }
            if (normalized.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (
              normalized.includes('/react/') ||
              normalized.includes('/react-dom/') ||
              normalized.includes('/scheduler/')
            ) {
              return 'vendor-react'
            }
            return 'vendor-libs'
          }

          if (normalized.includes('/src/data/stages/')) {
            return 'curriculum-stages'
          }

          if (normalized.includes('/src/data/glossary')) {
            return 'data-glossary'
          }

          if (normalized.includes('/src/data/flashcards')) {
            return 'data-flashcards'
          }

          if (
            normalized.includes('/src/data/catalog/') ||
            normalized.includes('/src/data/capstones') ||
            normalized.includes('/src/data/learningPath2026')
          ) {
            return 'data-catalog'
          }

          if (normalized.includes('/src/data/lessons/')) {
            if (normalized.includes('/src/data/lessons/c0-')) {
              return 'data-lessons-c0'
            }
            if (normalized.includes('/src/data/lessons/c1-')) {
              return 'data-lessons-c1'
            }
            if (
              normalized.includes('/src/data/lessons/c2-') ||
              normalized.includes('/src/data/lessons/de2-')
            ) {
              return 'data-lessons-c2-de2'
            }
            if (
              normalized.includes('/src/data/lessons/da2-') ||
              normalized.includes('/src/data/lessons/bi2-')
            ) {
              return 'data-lessons-da2-bi2'
            }
            if (
              normalized.includes('/src/data/lessons/de3-') ||
              normalized.includes('/src/data/lessons/da3-') ||
              normalized.includes('/src/data/lessons/bi3-')
            ) {
              return 'data-lessons-tier3'
            }
            if (
              normalized.includes('/src/data/lessons/de4-') ||
              normalized.includes('/src/data/lessons/da4-') ||
              normalized.includes('/src/data/lessons/bi4-') ||
              normalized.includes('/src/data/lessons/x4-')
            ) {
              return 'data-lessons-tier4'
            }
            return 'data-lessons-index'
          }

          if (normalized.includes('/src/components/visualizers/')) {
            return 'visualizers'
          }

          return undefined
        },
      },
    },
  },
})
