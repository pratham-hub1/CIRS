import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const BACKEND_TARGET =
  process.env.VITE_BACKEND_TARGET ||
  'https://misc-cholesterol-till-benefits.trycloudflare.com';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: BACKEND_TARGET,
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: BACKEND_TARGET,
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: BACKEND_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
