// Builds the application edition of the CV (V1-21.2): the CV of the site with the phone number, as a Word file.
//   node scripts/build-application-cv.mjs             writes cv/application/Truong_Tan_Khanh_CV.docx
//   node scripts/build-application-cv.mjs --dry-run   writes the file with "(phone on request)" to a temporary folder
// It reads `src/content/resume.ts` and `cv/private.json` (copy `scripts/application-cv/private.example.json` there and
// put your number in it). It is not part of `pnpm build`, `pnpm test` or the deploy workflow; only the dry run may run
// in CI. The number is in the file under `cv/` and nowhere else: this script prints no value of the private file.
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { generate, OutputError } from './application-cv/generate.mjs';
import { PrivateDataError } from './application-cv/private.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const started = performance.now();

const args = process.argv.slice(2);
// An argument is never repeated in a message, in case a number was typed where a flag belongs.
if (args.some((arg) => arg !== '--dry-run')) {
  console.error('Usage: node scripts/build-application-cv.mjs [--dry-run]');
  process.exit(1);
}

/** `resume.ts` as the site reads it, with the same Vite configuration, compiled on the fly (the server is not kept). */
async function loadResume() {
  const { createServer } = await import('vite');
  const server = await createServer({
    root,
    appType: 'custom',
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    return (await server.ssrLoadModule('/src/content/resume.ts')).resume;
  } finally {
    await server.close();
  }
}

try {
  const { file, bytes, dryRun } = await generate({ loadResume, dryRun: args.includes('--dry-run') });
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  const shown = dryRun ? file : relative(root, file);
  console.log(`${dryRun ? 'dry run: ' : ''}wrote ${shown} (${Math.round(bytes / 1024)} KB) in ${seconds} s`);
} catch (error) {
  if (!(error instanceof PrivateDataError || error instanceof OutputError)) throw error;
  console.error(error.message);
  process.exitCode = 1;
}
