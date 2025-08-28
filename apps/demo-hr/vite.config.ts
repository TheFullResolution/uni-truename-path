import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
port: 4000, // Fixed port for demo-hr app to avoid collisions with main app and other processes
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
