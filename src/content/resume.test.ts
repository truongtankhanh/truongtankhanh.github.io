import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resume } from './resume';
import { formatMonthLong, formatRange, parseMonth } from '../lib/dates';
import { emphasis, stripEmphasis } from '../lib/emphasis';
import { findPhoneNumber } from '../lib/privacy';

const toIndex = (m: `${number}-${number}`) => {
  const { year, month } = parseMonth(m);
  return year * 12 + month;
};

/** The bullets as the CV words them, before key phrases were marked with `**`. Edit both when the wording changes. */
const CV_BULLETS = [
  'Designed the monorepo architecture (pnpm workspaces and Turborepo): two apps and nine shared packages.',
  'Broke the full scope into 44 implementation-ready tickets across every feature epic, checked against the Figma designs.',
  'Designed the live camera integration, relayed to browsers by MediaMTX behind an adapter, so mock and production sources switch by configuration.',
  'Set the key technical decisions: 2D maps with MapLibre and deck.gl, single sign-on with an in-app permission model, and a single on-prem Docker Compose deployment.',
  'Still building the operator-view app hands-on.',
  'Primary developer of the core data processing and provisioning features (Node.js, TypeORM, PostgreSQL).',
  'Shipped services as Docker images to AWS ECR, running on Kubernetes; reviewed the team’s code and tests.',
  'Designed and maintain the team’s Claude Code pipelines used daily on NestJS, Angular and React code: diff-scoped self-review before PM review, API documentation with drift detection, test and lint scaffolding, and the ticket pipeline that delivered the command-center monorepo.',
  'Brandtmall, three years: built the AWS ECS services that keep Tmall listings in sync (S3, DynamoDB, AWS Translate); in phase two, led the move from JavaScript to TypeScript microservices on MySQL and owned image processing.',
  'Sole core developer of an eBay US listing service and core developer of a 95Point integration, owning staging and production releases.',
  'Primary developer of the Mercari integration and developer and code reviewer on the Yahoo Shopping integration (TypeScript, AWS CDK, RDS, TypeORM).',
  'Proposed, built and ran an internal serverless tool (API Gateway, React, CloudFront) that replaced direct edits of files on S3 with controlled, auditable updates.',
  'Web APIs with ASP.NET Core and Entity Framework Core, and Angular UI, for an AI-driven web platform.',
  'React Native apps connected to the company’s ERP system.',
];

describe('dates', () => {
  it('formats open and closed ranges', () => {
    expect(formatRange('2024-04')).toBe('Apr 2024 – present');
    expect(formatRange('2020-07', '2024-02')).toBe('Jul 2020 – Feb 2024');
  });

  it('spells a month out for running text', () => {
    expect(formatMonthLong('2024-04')).toBe('April 2024');
    expect(formatMonthLong('2018-12')).toBe('December 2018');
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

  describe('hero', () => {
    it('draws four layers whose tools all come from the skill group they name', () => {
      expect(resume.heroStack.map((l) => l.id)).toEqual(['frontend', 'backend', 'data', 'cloud']);
      for (const layer of resume.heroStack) {
        const group = resume.skills.find((g) => g.name === layer.group);
        expect(group, `${layer.label} names a skill group`).toBeDefined();
        for (const item of layer.items) {
          // "AWS" stands for "AWS (ECS, CDK, ...)" and "GitHub Actions" for "CI/CD with GitHub Actions".
          expect(
            group!.items.some((i) => i.includes(item)),
            `${item} is in ${layer.group}`,
          ).toBe(true);
        }
      }
    });

    it('shows every core tool in the stack, once', () => {
      const shown = resume.heroStack.flatMap((l) => l.items);
      expect(new Set(shown).size).toBe(shown.length);
      for (const tool of resume.coreStack) expect(shown).toContain(tool);
    });

    it('has a current role for the "Currently" fact, and a note for it', () => {
      expect(resume.experience.some((r) => !r.end)).toBe(true);
      expect(resume.currentlyNote.trim()).not.toBe('');
    });
  });

  it('points the CV link at an ASCII file name that matches the PDF build', () => {
    expect(resume.cv.fileName).toMatch(/^[\w.-]+\.pdf$/);
    expect(resume.cv.pdf).toBe(`/${resume.cv.fileName}`);
    expect(resume.cv.fileName).toBe(resume.cvPdf);
  });

  describe('experience bullets', () => {
    const bullets = resume.experience.flatMap((r) => r.work.flatMap((w) => w.points));

    it('keeps the CV wording exactly, apart from the emphasis markers', () => {
      expect(bullets.map(stripEmphasis)).toEqual(CV_BULLETS);
    });

    it('marks a key phrase in every bullet, never the whole bullet, with balanced markers', () => {
      for (const bullet of bullets) {
        const parts = emphasis(bullet); // throws on an unbalanced or empty marker
        expect(
          parts.some((p) => p.strong),
          bullet,
        ).toBe(true);
        expect(
          parts.every((p) => p.strong),
          bullet,
        ).toBe(false);
      }
    });
  });

  describe('principles and leadership', () => {
    const plain = (text: string) => stripEmphasis(text).toLowerCase().replace(/\.+$/, '').trim();
    // Where a line of evidence may come from, with the names its `source` has to mention.
    const places = [
      ...resume.experience.flatMap((r) =>
        r.work.flatMap((w) => w.points.map((p) => ({ text: plain(p), names: [r.company, w.name ?? ''] }))),
      ),
      ...resume.projects.map((p) => ({ text: plain(p.proof), names: [p.name] })),
    ];

    it('backs every principle with one or two lines quoted from a bullet or a proof, naming where each comes from', () => {
      for (const principle of resume.principles) {
        expect(principle.evidence.length, principle.title).toBeGreaterThanOrEqual(1);
        expect(principle.evidence.length, principle.title).toBeLessThanOrEqual(2);
        for (const e of principle.evidence) {
          const found = places.filter((place) => place.text.includes(plain(e.text)));
          expect(found.length, e.text).toBeGreaterThan(0);
          expect(
            found.some((place) => place.names.some((name) => name !== '' && e.source.includes(name))),
            `${e.text} (${e.source})`,
          ).toBe(true);
        }
      }
    });

    it('takes the leadership figures from the metrics', () => {
      expect(resume.leadership.figures.length).toBeGreaterThan(0);
      for (const f of resume.leadership.figures) {
        const metric = resume.metrics.find((m) => m.value === f.value);
        expect(metric?.label, f.value).toBe(f.label);
      }
      expect(resume.leadership.owns.length).toBeGreaterThan(0);
    });

    it('words the English level as a short level and a detail line', () => {
      const english = resume.languages.find((l) => l.name === 'English')!;
      expect(english.level).toBe('Working level');
      expect(english.detail).toBe(
        'Reads and writes technical documentation; speaks well enough for day-to-day work',
      );
      expect(JSON.stringify(resume)).not.toMatch(/improving spoken english/i);
    });
  });

  it('keeps a phone number off the public page', () => {
    // Serialising the whole object covers every field, including metrics, checks, case studies and the CV link.
    expect(findPhoneNumber(JSON.stringify(resume))).toBeUndefined();
  });
});
