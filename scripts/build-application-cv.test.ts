import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unpackBuffer } from './application-cv/docxParts';

const script = fileURLToPath(new URL('./build-application-cv.mjs', import.meta.url));
const root = fileURLToPath(new URL('..', import.meta.url));

/** The folders a dry run made, so each test leaves nothing behind. */
const made: string[] = [];
afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const run = (...args: string[]) =>
  spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });

describe('build-application-cv.mjs', () => {
  it('writes the dry run, read from the real resume.ts, and says where', () => {
    const result = run('--dry-run');
    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/error/i);
    const file = /^dry run: wrote (\S+Truong_Tan_Khanh_CV\.docx) \(\d+ KB\) in [\d.]+ s$/m.exec(
      result.stdout,
    )?.[1];
    expect(file, result.stdout).toBeDefined();
    made.push(dirname(file!));
    const doc = unpackBuffer(readFileSync(file!));
    expect(doc.body).toContain('Trương Tấn Khánh');
    expect(doc.body).toContain('(phone on request)');
    const portfolio = /^dry run: wrote (\S+Truong_Tan_Khanh_Project_Portfolio\.docx) \(\d+ KB\)$/m.exec(
      result.stdout,
    )?.[1];
    expect(portfolio, result.stdout).toBeDefined();
    expect(dirname(portfolio!)).toBe(dirname(file!));
    expect(unpackBuffer(readFileSync(portfolio!)).body).toContain('Project Portfolio');
    const combined = /^dry run: wrote (\S+Truong_Tan_Khanh_CV_and_Portfolio\.docx) \(\d+ KB\)$/m.exec(
      result.stdout,
    )?.[1];
    expect(combined, result.stdout).toBeDefined();
    expect(dirname(combined!)).toBe(dirname(file!));
  }, 30_000);

  it('refuses an argument it does not know, without repeating it', () => {
    const result = run('--no-such-flag');
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/^Usage: node scripts\/build-application-cv\.mjs \[--dry-run\]/);
    expect(result.stderr).not.toContain('no-such-flag');
    expect(result.stdout).toBe('');
  });
});
