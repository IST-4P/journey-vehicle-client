
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react'
  import path from 'path';

  export default defineConfig({
    plugins: [react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
      hmr: {
        port: 3001, // Use different port for HMR
        host: 'localhost'
      }
    },
  });
