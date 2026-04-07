import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Keep your HMR setting as is
      hmr: process.env.DISABLE_HMR !== 'true',
      port: 8080,        // <--- ADD THIS
      host: '0.0.0.0',   // <--- ADD THIS
    },
    preview: {           // <--- ADD THIS ENTIRE BLOCK
      port: 8080,
      host: '0.0.0.0',
      allowedHosts: true // Helps with the "Invalid Host Header" error in Cloud Run
    }
  };
});
