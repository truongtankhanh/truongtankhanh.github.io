// Builds the public CV PDF from the finished site, so it cannot drift from src/content/resume.ts.
// It serves dist/ on localhost, prints the home page with headless Chrome (the site's own print
// stylesheet turns it into an A4 CV) and writes dist/<cvPdf>. Run it after `pnpm build`.
// CI runs it on the runner's Chrome; locally set CHROME_PATH if Chrome is not found.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep in sync with `cvPdf` in src/content/resume.ts (a test checks it).
const CV_PDF = 'Truong_Tan_Khanh_CV.pdf';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
if (!existsSync(join(dist, 'index.html')))
  throw new Error('dist/index.html is missing: run `pnpm build` first');

const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chrome = process.env.CHROME_PATH ?? (existsSync(MAC_CHROME) ? MAC_CHROME : 'google-chrome');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(
    /^(\.\.[/\\])+/,
    '',
  );
  let file = join(dist, path);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

// Chrome runs as an async child so this process keeps serving dist/ while it prints, and it gets
// a throwaway profile so it never attaches to a Chrome window that is already open.
const profile = await mkdtemp(join(tmpdir(), 'cv-pdf-'));
try {
  const { port } = server.address();
  const out = join(dist, CV_PDF);
  const exit = await new Promise((resolve, reject) => {
    const child = spawn(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        `--user-data-dir=${profile}`,
        '--no-pdf-header-footer',
        '--virtual-time-budget=8000',
        `--print-to-pdf=${out}`,
        `http://127.0.0.1:${port}/`,
      ],
      { stdio: 'inherit' },
    );
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Chrome took longer than 90 s to print the page'));
    }, 90_000);
    child.on('error', (e) => reject(new Error(`Could not start ${chrome}: ${e.message}`)));
    child.on('exit', (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });
  if (exit !== 0 || !existsSync(out)) throw new Error(`Chrome did not write the PDF (exit ${exit})`);
  const { size } = await stat(out);
  console.log(`wrote dist/${CV_PDF} (${Math.round(size / 1024)} KB)`);
} finally {
  server.close();
  await rm(profile, { recursive: true, force: true });
}
