import { statSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Keep in sync with `cvPdf` in src/content/resume.ts (a test checks it).
const CV_PDF = 'Truong_Tan_Khanh_CV.pdf';

/**
 * Size of the CV PDF that `pnpm build:pdf` printed into dist-pdf/, or null when there is none. The page and the
 * server render read it as `__CV_PDF_BYTES__`, so the download links and their size follow the file: a build that
 * has no PDF has no link, and the browser hydrates exactly what was prerendered. Tests never see a file.
 */
function cvPdfBytes(mode: string): number | null {
  if (mode === 'test') return null;
  try {
    return statSync(new URL(`./dist-pdf/${CV_PDF}`, import.meta.url)).size;
  } catch {
    return null;
  }
}

// The site is served from the root of truongtankhanh.github.io, so the base stays '/'.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: { __CV_PDF_BYTES__: JSON.stringify(cvPdfBytes(mode)) },
  // strictPort fails loudly instead of silently hopping to another port when 5390 is taken.
  server: { port: 5390, strictPort: true },
  build: { assetsInlineLimit: 0 },
}));
