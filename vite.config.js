import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { googleAiUltraBridgePlugin } from './server/aiUltraBridge.js';

export default defineConfig({
  plugins: [react(), googleAiUltraBridgePlugin()],
  server: {
    port: 5174,
    host: '127.0.0.1',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
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
