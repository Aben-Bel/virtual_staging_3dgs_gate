import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pure SPA — the browser calls Gemini directly with the user-supplied key.
// COOP/COEP make the page cross-origin isolated so the splat viewer can use
// SharedArrayBuffer (fast worker sort + GPU-accelerated sort).
const crossOriginIsolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, headers: crossOriginIsolation },
  preview: { headers: crossOriginIsolation },
});
