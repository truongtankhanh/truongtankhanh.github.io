import { describe, expect, it } from 'vitest';
import { resume } from '../content/resume';
import { downloadLabel } from './cv';

describe('downloadLabel', () => {
  it('names the type and the size in whole kilobytes', () => {
    expect(downloadLabel({ ...resume.cv, bytes: 184_320 }, 'Download CV')).toBe('Download CV, PDF, 180 KB');
    expect(downloadLabel({ ...resume.cv, bytes: 184_900 }, 'Download CV')).toBe('Download CV, PDF, 181 KB');
  });

  it('never says 0 KB for a small file', () => {
    expect(downloadLabel({ ...resume.cv, bytes: 100 }, 'Download CV')).toBe('Download CV, PDF, 1 KB');
  });

  it('leaves the size out when the build did not give one', () => {
    expect(downloadLabel({ ...resume.cv, bytes: null }, 'Download CV')).toBe('Download CV, PDF');
  });
});
