import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Matches the backend's default CORS origin (http://localhost:3001).
    port: 3001,
    strictPort: false,
  },
});
