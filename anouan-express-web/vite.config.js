import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: ['mobile', 'device'].includes(mode) ? './' : '/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libs groupées → chargées une fois, cachées longtemps
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':       ['lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-qrcode':   ['qrcode.react'],
          'vendor-axios':    ['axios'],
          'vendor-recharts': ['recharts'],
        },
      },
    },
  },
}));
