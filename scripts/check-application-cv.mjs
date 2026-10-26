// Checks that the application edition tells the story of the site (V1-21.4), and that the phone number is where it
// should be and nowhere else (the CV, the portfolio and the two in one file):
//   node scripts/check-application-cv.mjs             checks cv/application/*.docx against resume.ts and cv/private.json
//   node scripts/check-application-cv.mjs --dry-run   makes the dry-run files in a temporary folder, checks them, and
//                                                     removes them; needs no private file, so CI may run it
// Run it after `pnpm build:application-cv`. It prints each rule that failed, with the file, and exits with 1; a clean
// run prints how the two editions differ and exits with 0. It never prints the phone number.
import { existsSync, readFileSync } from 'node:fs';
import { readdir, rm } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkParity, readDocx } from './application-cv/check.mjs';
import { combinedFileName } from './application-cv/combined.mjs';
import { fileName } from './application-cv/cv.mjs';
import { exampleProjects, generate, OUTPUT_FOLDER } from './application-cv/generate.mjs';
import { loadResume } from './application-cv/load-resume.mjs';
import { PORTFOLIO_PROPERTIES, portfolioFileName } from './application-cv/portfolio.mjs';
import { CV_DIR, loadPrivate, PrivateDataError } from './application-cv/private.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

const args = process.argv.slice(2);
// An argument is never repeated in a message, in case a number was typed where a flag belongs.
if (args.some((arg) => arg !== '--dry-run')) {
  console.error('Usage: node scripts/check-application-cv.mjs [--dry-run]');
  process.exit(1);
}
const dryRun = args.includes('--dry-run');

class CheckError extends Error {
  name = 'CheckError';
}

const open = async (path) => readDocx(readFileSync(path), path.split('/').at(-1));

/**
 * The old appendix, if it is there to compare with: the first file of that name in `cv/archive/*` or in `cv/` that
 * this script's generator did not write. After the cut-over the old file is in the archive and the new one has its name.
 */
async function oldAppendix(resume) {
  const name = portfolioFileName(resume);
  const archive = join(CV_DIR, 'archive');
  const folders = existsSync(archive) ? (await readdir(archive)).sort().map((dir) => join(archive, dir)) : [];
  for (const folder of [...folders, CV_DIR]) {
    const path = join(folder, name);
    if (!existsSync(path)) continue;
    const doc = await open(path);
    if (!doc.core.includes(PORTFOLIO_PROPERTIES.description)) return doc;
  }
  return undefined;
}

/** What to check: the two files, the data they were built from and, if there is one, the old appendix. */
async function whatToCheck(resume) {
  if (dryRun) {
    const made = await generate({ loadResume: async () => resume, dryRun: true });
    const folder = dirname(made.file);
    return {
      folder,
      input: {
        files: {
          cv: await open(made.file),
          portfolio: made.portfolio && (await open(made.portfolio.file)),
          combined: made.combined && (await open(made.combined.file)),
        },
        projects: exampleProjects(),
      },
    };
  }
  const data = loadPrivate();
  const folder = join(CV_DIR, OUTPUT_FOLDER);
  const missing = (path) =>
    new CheckError(`${relative(root, path)} is missing; run pnpm build:application-cv first.`);
  const cvPath = join(folder, fileName(resume));
  if (!existsSync(cvPath)) throw missing(cvPath);
  const portfolioPath = join(folder, portfolioFileName(resume));
  if (data.extraProjects.length > 0 && !existsSync(portfolioPath)) throw missing(portfolioPath);
  const combinedPath = join(folder, combinedFileName(resume));
  if (data.extraProjects.length > 0 && !existsSync(combinedPath)) throw missing(combinedPath);
  return {
    input: {
      files: {
        cv: await open(cvPath),
        portfolio: data.extraProjects.length > 0 ? await open(portfolioPath) : undefined,
        combined: data.extraProjects.length > 0 ? await open(combinedPath) : undefined,
      },
      phone: data.phone,
      projects: data.extraProjects,
      linkedin: data.linkedin,
      master: data.extraProjects.length > 0 ? await oldAppendix(resume) : undefined,
    },
  };
}

let folder;
try {
  const resume = await loadResume();
  const todo = await whatToCheck(resume);
  folder = todo.folder;
  const { failures, passed, differences } = checkParity({ resume, dryRun, ...todo.input });

  const names = [...new Set(passed.concat(failures).map((item) => item.file))];
  for (const name of names) {
    const ok = passed.filter((item) => item.file === name).map((item) => item.rule);
    const bad = new Set(failures.filter((item) => item.file === name).map((item) => item.rule));
    console.log(
      `${bad.size === 0 ? '✔' : '✘'} ${name}: ${ok.length} rule(s) passed${bad.size > 0 ? `, ${bad.size} failed` : ''}`,
    );
  }
  for (const { rule, file, message } of failures) console.error(`✘ ${rule} (${file}): ${message}`);
  console.log(
    `\nDifferences from the public edition:\n${differences.map((line) => `  - ${line}`).join('\n')}`,
  );
  if (failures.length > 0) process.exitCode = 1;
} catch (error) {
  if (!(error instanceof PrivateDataError || error instanceof CheckError)) throw error;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (folder) await rm(folder, { recursive: true, force: true });
}
