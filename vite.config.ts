import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Deployed behind /app, because f0undr Ai (web-chat) owns the site root.
  // Only the build is prefixed, so `npm run dev` still serves at /.
  base: command === 'build' ? '/app/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5175,
    host: true,
  },
}));
