import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La API corre en :4001 (ver backend/.env). En dev proxeamos /api para
// evitar CORS y no depender de una URL absoluta.
const API_TARGET = process.env.VITE_API_PROXY || 'http://localhost:4001';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // 5173/5174 suelen estar ocupados en esta máquina; fijamos uno propio.
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
});
