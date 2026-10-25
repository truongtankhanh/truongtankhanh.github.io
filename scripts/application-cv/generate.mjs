// Writes the application CV (V1-21.2): reads `cv/private.json`, builds the document of `cv.mjs` and puts it in
// `cv/application/`. It writes nowhere else and touches no file of `cv/` itself, where the old masters are until the
// cut-over (V1-22.3). A dry run needs no private file: the phone is `PHONE_ON_REQUEST` and the file goes to a new
// temporary folder, so CI can check that the generator still works after a change to the content.
//
// The resume comes from `loadResume`, which the caller gives, so this module does not care how `resume.ts` is read.
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative } from 'node:path';
import { Packer } from 'docx';
import { buildCvDocument, fileName, PHONE_ON_REQUEST } from './cv.mjs';
import { LOGO_FILE } from './header.mjs';
import { CV_DIR, loadPrivate, PRIVATE_FILE } from './private.mjs';

/** The folder of `cv/` that holds what this script writes. */
export const OUTPUT_FOLDER = 'application';

export class OutputError extends Error {
  name = 'OutputError';
}

const isInside = (parent, child) => {
  const path = relative(parent, child);
  return path !== '' && !path.startsWith('..') && !isAbsolute(path);
};

/** `cv/application/`, made if it is missing, and only if its real path is that folder and not a link elsewhere. */
function outputFolder(cvDir) {
  const folder = join(cvDir, OUTPUT_FOLDER);
  mkdirSync(folder, { recursive: true });
  const realCv = realpathSync(cvDir);
  const real = realpathSync(folder);
  if (!isInside(realCv, real) || real !== join(realCv, OUTPUT_FOLDER)) {
    throw new OutputError(
      `${folder} must be a folder of its own inside ${cvDir}, not a link to somewhere else.`,
    );
  }
  return real;
}

/** Throws if something other than a plain file is where the CV goes. A file that is there is the last run's. */
function checkTarget(file) {
  let stat;
  try {
    stat = lstatSync(file);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  if (!stat.isFile()) throw new OutputError(`${file} exists and is not a plain file, so it is left alone.`);
}

/**
 * @param {object} input
 * @param {() => Promise<object>} input.loadResume Gives the content of `src/content/resume.ts`.
 * @param {boolean} [input.dryRun] No private file, a placeholder for the phone, a temporary folder.
 * @param {string} [input.cvDir] Only the tests change this and the next.
 * @param {string} [input.privateFile]
 * @returns {Promise<{ file: string, bytes: number, dryRun: boolean }>}
 */
export async function generate({ loadResume, dryRun = false, cvDir = CV_DIR, privateFile = PRIVATE_FILE }) {
  // The private file first: a missing or wrong file stops the run before anything is read or written.
  const data = dryRun ? { phone: PHONE_ON_REQUEST } : loadPrivate({ file: privateFile, cvDir });
  const resume = await loadResume();
  // The LinkedIn override of Q12, for the day the address of the old masters is the live one.
  const content = data.linkedin ? { ...resume, links: { ...resume.links, linkedin: data.linkedin } } : resume;

  const buffer = await Packer.toBuffer(
    buildCvDocument({ resume: content, phone: data.phone, logo: readFileSync(LOGO_FILE) }),
  );

  const folder = dryRun ? mkdtempSync(join(tmpdir(), 'application-cv-')) : outputFolder(cvDir);
  const file = join(folder, fileName(resume));
  checkTarget(file);
  writeFileSync(file, buffer);
  return { file, bytes: buffer.length, dryRun };
}
