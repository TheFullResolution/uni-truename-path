import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
port: 4500, // Fixed port for demo-chat app (matches OAuth config)
host: true,
strictPort: true, // Exit if port is already in use
  },
  build: {
outDir: 'dist',
sourcemap: true,
  },
  resolve: {
alias: {
  '@': '/src',
},
  },
});
