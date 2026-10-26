// Builds the application edition of the CV (V1-21.2, V1-21.3): the CV of the site with the phone number, and the
// project portfolio that goes with it, as Word files.
//   node scripts/build-application-cv.mjs             writes cv/application/Truong_Tan_Khanh_CV.docx, and
//                                                     Truong_Tan_Khanh_Project_Portfolio.docx and Truong_Tan_Khanh_CV_and_Portfolio.docx
//                                                     (the two in one file) when the private file has projects
//   node scripts/build-application-cv.mjs --dry-run   the same with "(phone on request)" and made-up projects, in a temporary folder
// It reads `src/content/resume.ts` and `cv/private.json` (copy `scripts/application-cv/private.example.json` there and
// put your number in it). It is not part of `pnpm build`, `pnpm test` or the deploy workflow; only the dry run may run
// in CI. The number is in the file under `cv/` and nowhere else: this script prints no value of the private file.
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { generate, OutputError } from './application-cv/generate.mjs';
import { loadResume } from './application-cv/load-resume.mjs';
import { PrivateDataError } from './application-cv/private.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const started = performance.now();

const args = process.argv.slice(2);
// An argument is never repeated in a message, in case a number was typed where a flag belongs.
if (args.some((arg) => arg !== '--dry-run')) {
  console.error('Usage: node scripts/build-application-cv.mjs [--dry-run]');
  process.exit(1);
}

try {
  const { file, bytes, dryRun, portfolio, combined } = await generate({
    loadResume,
    dryRun: args.includes('--dry-run'),
  });
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  const line = (path, size) =>
    `${dryRun ? 'dry run: ' : ''}wrote ${dryRun ? path : relative(root, path)} (${Math.round(size / 1024)} KB)`;
  console.log(`${line(file, bytes)} in ${seconds} s`);
  if (portfolio) console.log(line(portfolio.file, portfolio.bytes));
  if (combined) console.log(line(combined.file, combined.bytes));
  if (!portfolio) console.log('no portfolio: extraProjects of cv/private.json is empty');
} catch (error) {
  if (!(error instanceof PrivateDataError || error instanceof OutputError)) throw error;
  console.error(error.message);
  process.exitCode = 1;
}
