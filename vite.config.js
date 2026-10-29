import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { granoAiPlugin } from './server/ai/routes.js';

export default defineConfig({
  plugins: [react(), granoAiPlugin()],
  server: {
    port: 5174,
    host: '127.0.0.1',
    fs: {
      allow: ['..'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@duckdb') || id.includes('@codemirror') || id.includes('@lezer')) {
            return undefined;
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('/src/data/stages/') || id.includes('\\src\\data\\stages\\')) {
            return 'curriculum-stages';
          }
        },
      },
    },
  },
});
