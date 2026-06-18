import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pure SPA — the browser calls Gemini directly with the user-supplied key.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
