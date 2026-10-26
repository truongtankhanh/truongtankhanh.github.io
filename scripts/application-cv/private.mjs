// Loads `cv/private.json` (V1-21.1): the phone number and the details that exist only in the application edition. The
// file is local, listed in `.git/info/exclude`, and never committed, copied to `public/` or read by `pnpm build` or CI.
// This module holds no secret; `private.example.json` shows the shape with a placeholder, and the real file is made by
// copying it to `cv/private.json`.
//
// The file is JSON with these keys; any other key is refused, except one that starts with `$` (such as `$comment`),
// which is ignored, so a typo like "phon" does not pass unseen:
//   phone          required, a Vietnamese number in a form `src/lib/privacy.ts` can find (see `isPhoneNumber`)
//   linkedin       optional, an https address on linkedin.com to use instead of the one in `resume.ts` (Q12)
//   extraProjects  optional array, the projects of the portfolio that exist only in the private masters (Q11); each is
//                  checked by `checkProjects`
//   overrides      optional object, facts of the masters that replace the public wording (Q11); no fact needs it yet,
//                  so it is only checked to be an object
//
// A message never repeats a value from the file, because the terminal and CI logs are not private.
import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CV_DIR = fileURLToPath(new URL('../../cv/', import.meta.url));
export const PRIVATE_FILE = `${CV_DIR}private.json`;

/** The keys of the file, in the order above. */
export const KEYS = ['phone', 'linkedin', 'extraProjects', 'overrides'];

// Keep in sync with `src/lib/privacy.ts` (a test checks it): a number that matches one of these is found by the privacy
// scan of the public site, so a leak of it would be caught.
const INTERNATIONAL = /(?:\+|\b00)\s*84/;
const NATIONAL = /\b0(?:[\s.-]?\d){9}\b/;

/** True if `text` holds something the privacy scan of the public site would take for a phone number. */
export const looksLikePhone = (text) => INTERNATIONAL.test(text) || NATIONAL.test(text);

/** What a phone number may be made of: digits, spaces, dots, dashes, parentheses and a plus. */
const WRITTEN = /^[\d\s.()+-]+$/;

export class PrivateDataError extends Error {
  name = 'PrivateDataError';
}

/**
 * True for a Vietnamese number written as the privacy scan reads it: a leading zero and nine digits, or the country
 * code of Vietnam (after a plus sign or two zeros, optionally followed by the trunk zero) and nine digits, with
 * spaces, dots, dashes or parentheses between them.
 */
export function isPhoneNumber(text) {
  const value = text.trim();
  if (!WRITTEN.test(value) || !(INTERNATIONAL.test(value) || NATIONAL.test(value))) return false;
  const digits = value.replace(/\D/g, '');
  return /^0\d{9}$/.test(digits) || /^(?:00)?840?\d{9}$/.test(digits);
}

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The fields of a project of the portfolio (V1-21.3). `name` and `tableRole` are what the overview table shows, `title`
 * (else `name`) heads the block, `stack` is the text of the master's "Tech stack" line, and `source` says where in the
 * master the project was taken from, so nothing is typed from memory. `privateOnly` lists the facts of the project that
 * the public edition leaves out on purpose (a client name, a product name), each as it is written in the files; the
 * parity check (V1-21.4) proves they are in the application files and not in the public content, and lists them.
 */
export const PROJECT_REQUIRED = ['name', 'company', 'duration', 'tableRole', 'role', 'source'];
export const PROJECT_OPTIONAL = ['title', 'overview', 'team', 'stack', 'responsibilities', 'privateOnly'];

/** The optional fields that are a list of texts and not one text. */
const PROJECT_LISTS = ['responsibilities', 'privateOnly'];

/**
 * What is wrong with `projects`, or `undefined`. The message names the position and the field, never the value.
 */
export function checkProjects(projects) {
  for (const [i, project] of projects.entries()) {
    const at = `extraProjects[${i}]`;
    if (!isPlainObject(project)) return `${at} must be an object.`;
    const unknown = Object.keys(project).filter(
      (key) => !PROJECT_REQUIRED.includes(key) && !PROJECT_OPTIONAL.includes(key),
    );
    if (unknown.length > 0) return `${at} has an unknown key: ${unknown.join(', ')}.`;
    const text = (value) => typeof value === 'string' && value.trim() !== '';
    for (const key of PROJECT_REQUIRED)
      if (!text(project[key])) return `${at}: "${key}" must be a non-empty string.`;
    for (const key of PROJECT_OPTIONAL.filter((key) => !PROJECT_LISTS.includes(key))) {
      if (project[key] !== undefined && !text(project[key]))
        return `${at}: "${key}" must be a non-empty string.`;
    }
    for (const key of PROJECT_LISTS) {
      const list = project[key];
      if (list !== undefined && !(Array.isArray(list) && list.length > 0 && list.every(text))) {
        return `${at}: "${key}" must be a list of non-empty strings.`;
      }
    }
  }
  return undefined;
}

/**
 * Reads and checks the private file. Throws `PrivateDataError` when the file is missing, is not inside `cvDir`, is not
 * JSON or has an empty or invalid phone number.
 *
 * @param {{ file?: string, cvDir?: string }} [where] Only the tests change these two.
 * @returns {{ phone: string, linkedin?: string, extraProjects: unknown[], overrides: Record<string, unknown> }}
 */
export function loadPrivate({ file = PRIVATE_FILE, cvDir = CV_DIR } = {}) {
  const label = file === PRIVATE_FILE ? 'cv/private.json' : file;
  const fail = (message) => {
    throw new PrivateDataError(`${label}: ${message}`);
  };

  // The real paths, so a link from `cv/` to a file elsewhere does not pass as being inside it.
  let real;
  let realCv;
  try {
    real = realpathSync(file);
    realCv = realpathSync(cvDir);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    fail(
      'the file is missing. Copy scripts/application-cv/private.example.json to cv/private.json and put your phone ' +
        'number in it; the file stays on this machine and is never committed.',
    );
  }
  const inside = relative(realCv, real);
  if (inside === '' || inside.startsWith('..') || isAbsolute(inside))
    fail('the file must be inside the cv/ folder.');

  let data;
  try {
    data = JSON.parse(readFileSync(real, 'utf8'));
  } catch {
    // The message of `JSON.parse` quotes part of the text, which may be the number.
    fail('the file is not valid JSON.');
  }
  if (!isPlainObject(data)) fail('the file must hold one JSON object.');

  const unknown = Object.keys(data).filter((key) => !KEYS.includes(key) && !key.startsWith('$'));
  if (unknown.length > 0) fail(`unknown key${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}.`);

  if (typeof data.phone !== 'string' || data.phone.trim() === '') fail('"phone" is missing or empty.');
  if (!isPhoneNumber(data.phone)) {
    fail(
      '"phone" is not a Vietnamese number the privacy scan can find: a leading zero and nine digits, or the country code and nine digits.',
    );
  }

  if (data.linkedin !== undefined) {
    let url;
    try {
      url = new URL(data.linkedin);
    } catch {
      fail('"linkedin" must be an https address on linkedin.com.');
    }
    if (url.protocol !== 'https:' || !/(^|\.)linkedin\.com$/.test(url.hostname)) {
      fail('"linkedin" must be an https address on linkedin.com.');
    }
  }
  if (data.extraProjects !== undefined && !Array.isArray(data.extraProjects))
    fail('"extraProjects" must be an array.');
  const problem = data.extraProjects && checkProjects(data.extraProjects);
  if (problem) fail(problem);
  if (data.overrides !== undefined && !isPlainObject(data.overrides)) fail('"overrides" must be an object.');

  return {
    phone: data.phone.trim(),
    ...(data.linkedin !== undefined && { linkedin: data.linkedin }),
    extraProjects: data.extraProjects ?? [],
    overrides: data.overrides ?? {},
  };
}
