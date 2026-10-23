import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resume } from './resume';
import { formatRange, parseMonth } from '../lib/dates';

const toIndex = (m: `${number}-${number}`) => {
  const { year, month } = parseMonth(m);
  return year * 12 + month;
};

describe('dates', () => {
  it('formats open and closed ranges', () => {
    expect(formatRange('2024-04')).toBe('Apr 2024 – present');
    expect(formatRange('2020-07', '2024-02')).toBe('Jul 2020 – Feb 2024');
  });

  it('rejects months that are not YYYY-MM', () => {
    expect(() => parseMonth('2024-13')).toThrow();
    expect(() => parseMonth('24-1' as `${number}-${number}`)).toThrow();
  });
});

describe('resume content', () => {
  it('lists roles newest first, each ending after it starts, with one current role', () => {
    const roles = resume.experience;
    expect(roles.filter((r) => !r.end)).toHaveLength(1);
    for (const r of roles) if (r.end) expect(toIndex(r.end)).toBeGreaterThanOrEqual(toIndex(r.start));
    for (let i = 1; i < roles.length; i++) {
      expect(toIndex(roles[i - 1]!.start)).toBeGreaterThan(toIndex(roles[i]!.start));
    }
  });

  it('has the five platform repositories exactly once, all on this GitHub account', () => {
    const ids = resume.projects.map((p) => p.id);
    expect(new Set(ids)).toEqual(new Set(['occ', 'telemetry', 'aws', 'adr', 'pipelines']));
    expect(ids).toHaveLength(5);
    for (const p of resume.projects)
      expect(p.repo).toMatch(/^https:\/\/github\.com\/truongtankhanh\/[\w.-]+$/);
  });

  it('ships every screenshot it references, with alt text', () => {
    for (const p of resume.projects) {
      if (!p.image) continue;
      expect(existsSync(new URL(`../../public/${p.image.src}`, import.meta.url))).toBe(true);
      expect(p.image.alt.length).toBeGreaterThan(20);
    }
  });

  it('keeps a phone number off the public page', () => {
    expect(JSON.stringify(resume)).not.toMatch(/\b0\d{9}\b|\+84/);
  });
});
