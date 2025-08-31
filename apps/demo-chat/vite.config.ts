import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
port: 4500,
host: true,
strictPort: true,
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
