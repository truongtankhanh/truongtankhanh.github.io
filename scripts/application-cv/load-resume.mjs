// Reads `src/content/resume.ts` as the site reads it: through Vite, with the same configuration, compiled on the fly.
// The server is a throwaway one and is closed before this returns. It opens no port (`ws: false`; `hmr: false` alone
// still starts the WebSocket server of hot reload on port 24678, which a running `pnpm dev` or a second script
// already holds) and has a cache folder of its own, because Vite's dependency cache in `node_modules/.vite` is
// written by every server that starts, and two at once made one of them fail.
import { mkdtempSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

export async function loadResume() {
  const { createServer } = await import('vite');
  const cacheDir = mkdtempSync(join(tmpdir(), 'vite-resume-'));
  const server = await createServer({
    root,
    cacheDir,
    appType: 'custom',
    logLevel: 'error',
    server: { middlewareMode: true, ws: false, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    return (await server.ssrLoadModule('/src/content/resume.ts')).resume;
  } finally {
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
}
