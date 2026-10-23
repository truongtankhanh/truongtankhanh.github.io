import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The site is served from the root of truongtankhanh.github.io, so the base stays '/'.
export default defineConfig({
  plugins: [react()],
  build: { assetsInlineLimit: 0 },
  define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)) },
});
