import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resume } from '../content/resume';
import { pdfParityProblems } from './pdfParity';

// The CV PDF of the finished build. `pnpm test` skips this when there is no file, so a local run never needs one;
// `pnpm test:pdf` (CI, after the build that ships the PDF) requires it.
const file = fileURLToPath(new URL(`../../dist/${resume.cv.fileName}`, import.meta.url));
const required = process.env.CV_PDF_REQUIRED === '1';

describe('the built CV PDF', () => {
  it.skipIf(!required && !existsSync(file))('says what resume.ts says and has no phone number', () => {
    expect(
      existsSync(file),
      `${file} is missing: run \`pnpm build\`, \`pnpm build:pdf\` and \`pnpm build\``,
    ).toBe(true);
    let text: string;
    try {
      text = execFileSync('pdftotext', ['-enc', 'UTF-8', '-nopgbrk', file, '-'], {
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      });
    } catch (error) {
      throw new Error(`Could not read the PDF with pdftotext (package poppler-utils): ${String(error)}`);
    }
    expect(text.trim(), 'the PDF has no selectable text').not.toBe('');
    expect(pdfParityProblems(text, resume)).toEqual([]);
  });
});
