import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./check-application-cv.mjs', import.meta.url));
const root = fileURLToPath(new URL('..', import.meta.url));

const run = (...args: string[]) =>
  spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });

describe('check-application-cv.mjs', () => {
  it('makes the dry-run files, checks them against the real resume.ts, lists the differences and exits with 0', () => {
    const result = run('--dry-run');
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^✔ Truong_Tan_Khanh_CV\.docx: \d+ rule\(s\) passed$/m);
    expect(result.stdout).toMatch(/^✔ Truong_Tan_Khanh_Project_Portfolio\.docx: \d+ rule\(s\) passed$/m);
    expect(result.stdout).toContain('Differences from the public edition:');
    expect(result.stdout).toContain('phone number: a dry run');
    expect(result.stdout).toContain('private-only: "a made-up client"');
  }, 30_000);

  it('refuses an argument it does not know, without repeating it', () => {
    const result = run('--no-such-flag');
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/^Usage: node scripts\/check-application-cv\.mjs \[--dry-run\]/);
    expect(result.stderr).not.toContain('no-such-flag');
    expect(result.stdout).toBe('');
  });
});
