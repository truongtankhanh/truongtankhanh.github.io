import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resume } from './resume';
import { formatRange, parseMonth } from '../lib/dates';
import { findPhoneNumber } from '../lib/privacy';

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

  describe('metrics', () => {
    const metric = (value: string) => resume.metrics.find((m) => m.value === value)!;
    const company = (name: string) => resume.experience.find((r) => r.company === name)!;
    const project = (id: string) => resume.projects.find((p) => p.id === id)!;

    it('has the five figures in career order, each with a label and a source', () => {
      expect(resume.metrics.map((m) => m.value)).toEqual(['7+', '5+', '3+', '~50', '~10k/s']);
      for (const m of resume.metrics) {
        expect(m.label.trim()).not.toBe('');
        expect(m.source.trim()).not.toBe('');
      }
    });

    it('takes "7+" from the earliest role and the intro', () => {
      const earliest = resume.experience.map((r) => r.start).sort()[0]!;
      const now = new Date();
      const months = now.getFullYear() * 12 + now.getMonth() + 1 - toIndex(earliest);
      expect(Math.floor(months / 12)).toBeGreaterThanOrEqual(7);
      expect(earliest).toBe('2018-12');
      expect(metric('7+').source).toBe('Since December 2018');
      expect(resume.intro.join(' ')).toContain('since 2018');
    });

    it('takes "5+" from the marketplaces named in the NewIT summary, written as a lower bound', () => {
      const named = ['Tmall', 'eBay US', 'Mercari', '95Point', 'Yahoo Shopping'];
      for (const name of named) {
        expect(company('NewIT Vietnam').summary).toContain(name);
        expect(metric('5+').source).toContain(name);
      }
      expect(metric('5+').source).toMatch(/ and more$/);
    });

    it('takes "3+" and "~50" from the Surbana Jurong summary', () => {
      const surbana = company('Surbana Jurong');
      expect(surbana.summary).toContain('three or more developers');
      expect(surbana.summary).toContain('about 50 repositories');
      expect(surbana.start).toBe('2024-04');
      expect(metric('3+').source).toContain('since April 2024');
    });

    it('takes "~10k/s" from the proof of the telemetry pipeline', () => {
      expect(project('telemetry').proof).toContain('About 10,000 messages a second on one replica');
    });
  });

  describe('skills', () => {
    it('lists six unique core technologies, each also in a skill group', () => {
      expect(resume.coreStack).toHaveLength(6);
      expect(new Set(resume.coreStack).size).toBe(6);
      const items = new Set(resume.skills.flatMap((g) => g.items));
      for (const tech of resume.coreStack) expect(items.has(tech), tech).toBe(true);
    });

    it('backs every skill group with at least one project or company from the data', () => {
      const known = new Set([
        ...resume.projects.map((p) => p.name),
        ...resume.experience.map((r) => r.company),
      ]);
      for (const g of resume.skills) {
        expect(g.usedIn.length, g.name).toBeGreaterThan(0);
        expect(new Set(g.usedIn).size, g.name).toBe(g.usedIn.length);
        for (const entry of g.usedIn) expect(known.has(entry), `${g.name}: ${entry}`).toBe(true);
      }
    });
  });

  describe('project cards and case studies', () => {
    /** Lower-case words with the separators and a dropped "and" after a comma or semicolon removed. */
    const words = (text: string) =>
      text
        .toLowerCase()
        .replace(/([,;])\s+and\s+/g, '$1 ')
        .replace(/[,;.]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

    it('gives every project its proof as a checklist that changes nothing but capitalisation and the final "and"', () => {
      for (const p of resume.projects) {
        expect(p.checks.length, p.name).toBeGreaterThan(1);
        expect(words(p.checks.join(' ')), p.name).toEqual(words(p.proof));
        for (const c of p.checks) expect(c, p.name).toMatch(/^[A-Z0-9]|^cdk-nag/);
      }
    });

    it('gives a project a key figure only together with the words of its proof that it restates', () => {
      for (const p of resume.projects) {
        expect(Boolean(p.stat), p.name).toBe(Boolean(p.statSource));
        if (!p.stat || !p.statSource) continue;
        expect(p.stat.value.trim(), p.name).not.toBe('');
        expect(p.stat.label.trim(), p.name).not.toBe('');
        expect(p.proof, p.name).toContain(p.statSource);
      }
      expect(project('occ').stat).toBeUndefined();
    });

    it('gives a case study a unique URL slug and a lead', () => {
      const studies = resume.projects.flatMap((p) => (p.caseStudy ? [p.caseStudy] : []));
      const slugs = studies.map((s) => s.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const s of studies) {
        expect(s.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        expect(s.lead.trim()).not.toBe('');
        expect(s.role.trim()).not.toBe('');
        expect(s.status.trim()).not.toBe('');
      }
    });

    function project(id: string) {
      return resume.projects.find((p) => p.id === id)!;
    }
  });

  it('points the CV link at an ASCII file name that matches the PDF build', () => {
    expect(resume.cv.fileName).toMatch(/^[\w.-]+\.pdf$/);
    expect(resume.cv.pdf).toBe(`/${resume.cv.fileName}`);
    expect(resume.cv.fileName).toBe(resume.cvPdf);
  });

  it('keeps a phone number off the public page', () => {
    // Serialising the whole object covers every field, including metrics, checks, case studies and the CV link.
    expect(findPhoneNumber(JSON.stringify(resume))).toBeUndefined();
  });
});
