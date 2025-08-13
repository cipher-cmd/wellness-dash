import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', '@tabler/icons-react'],
          utils: ['dexie'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    target: 'es2015', // Better compatibility
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion'],
  },
});
