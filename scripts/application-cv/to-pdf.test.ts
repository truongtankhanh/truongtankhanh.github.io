import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./to-pdf.mjs', import.meta.url));
const root = fileURLToPath(new URL('../../', import.meta.url));

describe('to-pdf.mjs', () => {
  it('refuses an argument, without repeating it, before it looks for any tool or starts LibreOffice', () => {
    const result = spawnSync(process.execPath, [script, '--no-such-flag'], { cwd: root, encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/^Usage: node scripts\/application-cv\/to-pdf\.mjs/);
    expect(result.stderr).not.toContain('no-such-flag');
    expect(result.stdout).toBe('');
  });
});
