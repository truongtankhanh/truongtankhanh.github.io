// Makes the PDF of the application CV, of its portfolio and of the two in one file with LibreOffice (V1-22.1), and checks them:
//   node scripts/application-cv/to-pdf.mjs      (or: pnpm pdf:application-cv)
// It needs `soffice` (LibreOffice) and the poppler tools `pdfinfo`, `pdffonts` and `pdftotext`; it says which are missing.
// Word's "Save as PDF" does the same job without this script, and the checks of `pdf.mjs` can be read as a list.
//
// LibreOffice is heavy, so the files are converted one after the other, never at once, and with a profile folder of its
// own that is removed afterwards, so a LibreOffice that is open is not disturbed. The PDFs are made and checked in a
// temporary folder, and only if every rule passes are they copied to `cv/application/`; if one fails, nothing in `cv/`
// changes and the folder is kept for a look. The phone number is in the PDFs, which stay under `cv/`; this script prints
// no value of the private file.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, lstatSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readDocx } from './check.mjs';
import { combinedFileName } from './combined.mjs';
import { fileName } from './cv.mjs';
import { OUTPUT_FOLDER } from './generate.mjs';
import { loadResume } from './load-resume.mjs';
import { portfolioFileName } from './portfolio.mjs';
import { checkPdf } from './pdf.mjs';
import { CV_DIR, loadPrivate, PrivateDataError } from './private.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));

const args = process.argv.slice(2);
// An argument is never repeated in a message, in case a number was typed where a flag belongs.
if (args.length > 0) {
  console.error('Usage: node scripts/application-cv/to-pdf.mjs');
  process.exit(1);
}

class PdfError extends Error {
  name = 'PdfError';
}

/** What to install for each tool, on macOS; elsewhere the package has another name but the tool is the same. */
const TOOLS = {
  soffice: 'LibreOffice: brew install --cask libreoffice',
  pdfinfo: 'poppler: brew install poppler (on Ubuntu: sudo apt-get install poppler-utils)',
  pdffonts: 'poppler: brew install poppler (on Ubuntu: sudo apt-get install poppler-utils)',
  pdftotext: 'poppler: brew install poppler (on Ubuntu: sudo apt-get install poppler-utils)',
};

const has = (tool) => spawnSync('sh', ['-c', `command -v ${tool}`]).status === 0;

/** Runs a tool and gives what it printed; a tool that fails is an error of ours, with its own words. */
function run(tool, toolArgs, options = {}) {
  const result = spawnSync(tool, toolArgs, { encoding: 'utf8', ...options });
  if (result.error || result.status !== 0) {
    throw new PdfError(
      `${tool} failed${result.error ? `: ${result.error.message}` : ` with status ${result.status}`}\n${result.stderr ?? ''}`.trim(),
    );
  }
  return result.stdout;
}

/** Throws if something other than a plain file is where a PDF goes. A file that is there is the last run's. */
function checkTarget(file) {
  if (existsSync(file) && !lstatSync(file).isFile())
    throw new PdfError(`${file} exists and is not a plain file, so it is left alone.`);
}

const missing = Object.keys(TOOLS).filter((tool) => !has(tool));
if (missing.length > 0) {
  const install = [...new Set(missing.map((tool) => TOOLS[tool]))].join(' and ');
  console.error(
    `Not found: ${missing.join(', ')}.\nInstall ${install}, or make the PDF with Word's "Save as PDF".`,
  );
  process.exit(1);
}

let temporary;
let failed = false;
try {
  const data = loadPrivate();
  const resume = await loadResume();
  const folder = join(CV_DIR, OUTPUT_FOLDER);
  const wanted = [
    { kind: 'cv', docx: fileName(resume), pdf: resume.cvPdf },
    ...(data.extraProjects.length > 0
      ? [
          {
            kind: 'portfolio',
            docx: portfolioFileName(resume),
            pdf: portfolioFileName(resume).replace(/\.docx$/, '.pdf'),
          },
          {
            kind: 'combined',
            docx: combinedFileName(resume),
            pdf: combinedFileName(resume).replace(/\.docx$/, '.pdf'),
          },
        ]
      : []),
  ];
  for (const { docx } of wanted) {
    if (!existsSync(join(folder, docx)))
      throw new PdfError(
        `${relative(root, join(folder, docx))} is missing; run pnpm build:application-cv first.`,
      );
  }
  for (const { pdf } of wanted) {
    if (!/^[\w.-]+\.pdf$/.test(pdf)) throw new PdfError(`${pdf} is not an ASCII file name`);
    checkTarget(join(folder, pdf));
  }

  temporary = mkdtempSync(join(tmpdir(), 'application-pdf-'));
  const profile = join(temporary, 'profile');
  const version = run('soffice', ['--version']).trim();
  console.log(`${version}; one file at a time.`);

  const made = [];
  for (const item of wanted) {
    const started = performance.now();
    // `-env:UserInstallation` is the profile of this run, so a LibreOffice that is open is not touched.
    run(
      'soffice',
      [
        '--headless',
        '--norestore',
        '--nologo',
        `-env:UserInstallation=${pathToFileURL(profile)}`,
        '--convert-to',
        'pdf',
        '--outdir',
        temporary,
        join(folder, item.docx),
      ],
      { timeout: 180_000, killSignal: 'SIGKILL' },
    );
    const file = join(temporary, item.docx.replace(/\.docx$/, '.pdf'));
    if (!existsSync(file)) throw new PdfError(`LibreOffice made no ${item.docx.replace(/\.docx$/, '.pdf')}`);

    const checked = checkPdf({
      kind: item.kind,
      bytes: statSync(file).size,
      pdfinfo: run('pdfinfo', ['-f', '1', '-l', '99', file]),
      pdffonts: run('pdffonts', [file]),
      text: run('pdftotext', ['-enc', 'UTF-8', file, '-']),
      docx: await readDocx(readFileSync(join(folder, item.docx)), item.docx),
      phone: data.phone,
    });
    made.push({ ...item, file, ...checked, seconds: ((performance.now() - started) / 1000).toFixed(1) });
  }

  for (const item of made) {
    const kb = Math.round(statSync(item.file).size / 1024);
    console.log(
      `${item.problems.length === 0 ? '✔' : '✘'} ${item.pdf}: ${item.pages} pages, ${kb} KB, ${item.fonts.join(', ')} (${item.seconds} s)`,
    );
    if (item.substituted) {
      console.log(
        `  note: Calibri is not among these fonts, so LibreOffice used others and the layout may differ from Word's.`,
      );
    }
    for (const { rule, message } of item.problems) console.error(`✘ ${rule} (${item.pdf}): ${message}`);
  }

  failed = made.some((item) => item.problems.length > 0);
  if (failed) {
    console.error(`\nNothing was copied to cv/. The PDFs are in ${temporary} for a look.`);
    process.exitCode = 1;
  } else {
    for (const item of made) copyFileSync(item.file, join(folder, item.pdf));
    console.log(`\nWrote ${made.map((item) => relative(root, join(folder, item.pdf))).join(' and ')}`);
  }
} catch (error) {
  failed = true;
  if (!(error instanceof PrivateDataError || error instanceof PdfError)) throw error;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (temporary && !failed) await rm(temporary, { recursive: true, force: true });
}
