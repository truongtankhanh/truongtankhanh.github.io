import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Packer, type Document } from 'docx';
import { resume } from '../../src/content/resume';
import type { Resume } from '../../src/content/types';

interface Docx {
  name: string;
  paragraphs: { style: string; text: string; inTable: boolean }[];
  tables: string[][][];
  footer: string;
  rels: string;
  core: string;
}
interface Project {
  name: string;
  title?: string;
  company: string;
  duration: string;
  tableRole: string;
  role: string;
  privateOnly?: string[];
  source: string;
}
interface Failure {
  rule: string;
  file: string;
  message: string;
}
interface Result {
  failures: Failure[];
  passed: { rule: string; file: string }[];
  differences: string[];
}
interface Check {
  readDocx(buffer: Buffer, name: string): Promise<Docx>;
  checkParity(input: {
    resume: Resume;
    files: { cv: Docx; portfolio?: Docx };
    phone?: string;
    dryRun?: boolean;
    projects?: Project[];
    master?: Docx;
    linkedin?: string;
  }): Result;
}

// The modules are plain JavaScript; computed specifiers keep the type checker out of them.
const checkPath = './check.mjs';
const cvPath = './cv.mjs';
const portfolioPath = './portfolio.mjs';
const headerPath = './header.mjs';
const { readDocx, checkParity } = (await import(checkPath)) as Check;
const { PHONE_ON_REQUEST, buildCvDocument } = (await import(cvPath)) as {
  PHONE_ON_REQUEST: string;
  buildCvDocument(input: { resume: Resume; phone: string; logo: Buffer }): Document;
};
const { buildPortfolioDocument } = (await import(portfolioPath)) as {
  buildPortfolioDocument(input: {
    resume: Resume;
    phone: string;
    logo: Buffer;
    projects: Project[];
  }): Document;
};
const { LOGO_FILE } = (await import(headerPath)) as { LOGO_FILE: URL };

// Put together here and not written out, so no number appears in this file.
const NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9].join('');
const PHONE = ['0', NINE.slice(0, 2), NINE.slice(2, 5), NINE.slice(5)].join(' ');
const logo = readFileSync(LOGO_FILE);

const example = JSON.parse(readFileSync(new URL('./private.example.json', import.meta.url), 'utf8')) as {
  extraProjects: Project[];
};
const projects = example.extraProjects;

/** The two files, made from `source` (the resume the files are made from) with `phone`. */
async function make({ source = resume, phone = PHONE, list = projects } = {}) {
  const read = async (document: Document, name: string) => readDocx(await Packer.toBuffer(document), name);
  return {
    cv: await read(buildCvDocument({ resume: source, phone, logo }), 'CV.docx'),
    portfolio: await read(
      buildPortfolioDocument({ resume: source, phone, logo, projects: list }),
      'Portfolio.docx',
    ),
  };
}

/** A copy of the resume with `change` applied. */
function changed(change: (copy: Resume) => void): Resume {
  const copy = structuredClone(resume);
  change(copy);
  return copy;
}

const files = await make();
/** Runs the check on `files` against `against`, as the owner does, and returns the failures. */
const run = (input: Partial<Parameters<Check['checkParity']>[0]> = {}) =>
  checkParity({ resume, files, phone: PHONE, projects, ...input });
const rules = (result: Result) => result.failures.map((f) => f.rule);

describe('readDocx', () => {
  it('reads the paragraphs with their styles, a tab where there is one, and the rows of a table', () => {
    expect(files.cv.paragraphs[1]).toEqual({ style: 'Title', text: `${resume.name}\t`, inTable: false });
    expect(files.cv.paragraphs.some((p) => p.style === 'Heading2' && p.text.includes('\t'))).toBe(true);
    expect(files.portfolio.tables[0]![0]).toEqual(['Project', 'Company', 'Duration', 'Role']);
    expect(files.portfolio.tables[0]).toHaveLength(1 + projects.length);
    expect(files.cv.footer).toContain(resume.name);
    expect(files.cv.core).toContain('Truong Tan Khanh, CV');
  });

  it('says which paragraphs are in a table cell, and only those', () => {
    const cells = files.portfolio.tables[0]!.flat();
    const inside = files.portfolio.paragraphs.filter((p) => p.inTable).map((p) => p.text);
    expect(inside).toEqual(cells);
    // A company is a cell of the table and also a heading below it: only the cell is in the table.
    const headings = files.portfolio.paragraphs.filter((p) => p.style === 'Heading1');
    expect(headings.map((p) => p.text)).toContain('NewIT Vietnam');
    expect(headings.every((p) => !p.inTable)).toBe(true);
    expect(files.cv.paragraphs.some((p) => p.inTable)).toBe(false);
  });

  it('turns the characters Word escapes back into themselves', async () => {
    const odd = [{ ...projects[0]!, name: 'A & B <c> "d"' }];
    const doc = (await make({ list: odd })).portfolio;
    expect(doc.tables[0]![1]![0]).toBe('A & B <c> "d"');
  });

  it('refuses something that is not a Word file', async () => {
    await expect(readDocx(Buffer.from('not a zip'), 'x.docx')).rejects.toThrow();
  });
});

describe('a clean run', () => {
  it('passes every rule, with the CV and the portfolio each having their own', () => {
    const result = run();
    expect(result.failures).toEqual([]);
    const of = (file: string) => result.passed.filter((p) => p.file === file).map((p) => p.rule);
    expect(of('CV.docx')).toEqual(
      expect.arrayContaining([
        'title',
        'experience',
        'figures',
        'english',
        'email',
        'old-wording',
        'placeholders',
        'phone',
      ]),
    );
    expect(of('Portfolio.docx')).toEqual(
      expect.arrayContaining([
        'portfolio-projects',
        'portfolio-roles',
        'portfolio-subtitle',
        'private-only',
        'phone',
      ]),
    );
    expect(of('Portfolio.docx')).not.toContain('title');
  });

  it('lists how the two editions differ, and never shows the phone number', () => {
    const { differences } = run({ linkedin: 'https://www.linkedin.com/in/x/' });
    const text = differences.join('\n');
    expect(text).toMatch(/phone number: in the contact line of each file/);
    expect(text).toMatch(/LinkedIn address/);
    expect(text).toContain(`${projects.length} project(s)`);
    for (const project of projects) expect(text).toContain(project.name);
    expect(text).toContain('private-only: "a made-up client" (Example project, NewIT Vietnam)');
    expect(text).toMatch(/old appendix: not found/);
    expect(text).not.toContain(NINE);
  });

  it('passes a dry run, which has the placeholder and no number anywhere', async () => {
    const dry = await make({ phone: PHONE_ON_REQUEST });
    const result = run({ files: dry, phone: undefined, dryRun: true });
    expect(result.failures).toEqual([]);
    expect(result.differences[0]).toMatch(/dry run/);
  });

  it('compares the portfolio with the old appendix when there is one, and passes when nothing was lost', async () => {
    const same = (await make()).portfolio;
    const result = run({ master: { ...same, name: 'Master.docx' } });
    expect(result.failures).toEqual([]);
    expect(result.passed.some((p) => p.rule === 'old-appendix')).toBe(true);
    expect(result.differences.join()).not.toMatch(/old appendix: not found/);
  });
});

describe('the roles and the title', () => {
  const noRole = changed((copy) => {
    copy.experience = copy.experience.filter((role) => role.company !== 'AMIT Group');
  });

  it('fail when a role of the site is not in the file', async () => {
    const stale = await make({ source: noRole });
    const result = run({ files: stale });
    expect(rules(result)).toContain('experience');
    expect(result.failures.find((f) => f.rule === 'experience')!.message).toMatch(/missing: "AMIT Group .*"/);
    expect(result.failures.find((f) => f.rule === 'experience')!.file).toBe('CV.docx');
  });

  it('fail when a role was removed from the site and the file still has it', () => {
    const result = run({ resume: noRole });
    expect(rules(result)).toContain('experience');
    expect(result.failures.find((f) => f.rule === 'experience')!.message).toMatch(
      /not in the site any more: "AMIT Group/,
    );
  });

  it('fail when the dates or the title of a role change', () => {
    const dates = run({ resume: changed((c) => (c.experience[1]!.start = '2020-08')) });
    expect(rules(dates)).toContain('experience');
    const title = run({ resume: changed((c) => (c.experience[1]!.title = 'Principal Engineer')) });
    expect(title.failures.find((f) => f.rule === 'experience')!.message).toMatch(/role titles/);
  });

  it('do not mind the order of the roles in resume.ts, because the file and the check are both newest first', () => {
    const order = run({ resume: changed((c) => c.experience.reverse()) });
    expect(order.failures).toEqual([]);
  });

  it('fail when the file has the roles in another order than newest first', () => {
    const heads = files.cv.paragraphs.flatMap((p, i) => (p.style === 'Heading2' ? [i] : []));
    const swapped = files.cv.paragraphs.map((p) => ({ ...p }));
    [swapped[heads[0]!], swapped[heads[1]!]] = [swapped[heads[1]!]!, swapped[heads[0]!]!];
    const result = run({ files: { ...files, cv: { ...files.cv, paragraphs: swapped } } });
    expect(result.failures.find((f) => f.rule === 'experience')!.message).toMatch(
      /in another order than the site/,
    );
  });

  it('fail when the title of the site changes and the file does not', () => {
    const result = run({ resume: changed((c) => (c.headline = 'Staff Engineer')) });
    expect(result.failures.find((f) => f.rule === 'title')!.message).toContain('"Full-stack Engineer"');
    expect(result.failures.find((f) => f.rule === 'title')!.message).toContain('"Staff Engineer"');
  });

  it('compare the dates without regard to case, because the file says "Present" and the site "present"', () => {
    expect(run().failures).toEqual([]);
    expect(files.cv.paragraphs.some((p) => p.text.endsWith('Present'))).toBe(true);
  });
});

describe('the figures, the languages and the email', () => {
  it('fail when a figure changes, keeping its + or ~ in the message', () => {
    const result = run({ resume: changed((c) => (c.metrics[0]!.value = '8+')) });
    expect(result.failures.find((f) => f.rule === 'figures')!.message).toContain(
      '8+ years shipping production software',
    );
  });

  it('fail when the English level or its words change', () => {
    const result = run({ resume: changed((c) => (c.languages[1]!.level = 'Fluent')) });
    expect(result.failures.find((f) => f.rule === 'english')!.message).toContain('English · Fluent');
    const detail = run({ resume: changed((c) => (c.languages[1]!.detail = 'Speaks well')) });
    expect(rules(detail)).toContain('english');
  });

  it('fail when the email of the site is not in the contact line', () => {
    const result = run({ resume: changed((c) => (c.email = 'someone@example.com')) });
    expect(result.failures.filter((f) => f.rule === 'email').map((f) => f.file)).toEqual([
      'CV.docx',
      'Portfolio.docx',
    ]);
  });
});

describe('the old wording and the placeholders', () => {
  it('fail on the old title and the old English level, wherever they are', async () => {
    const old = changed((c) => {
      c.experience[0]!.work[0]!.points[0] += ' As Project Lead / Senior Full-Stack Developer.';
      c.languages[1]!.detail = 'Actively improving spoken English';
    });
    const stale = await make({ source: old });
    const messages = checkParity({ resume, files: stale, phone: PHONE, projects })
      .failures.filter((f) => f.rule === 'old-wording')
      .map((f) => f.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Project Lead / Senior'),
        expect.stringContaining('actively improving'),
      ]),
    );
  });

  it.each(['TODO', 'undefined', 'FIXME', '[object Object]'])('fail on the placeholder %s', async (word) => {
    const stale = await make({ source: changed((c) => (c.intro[0] += ` ${word}`)) });
    const result = checkParity({ resume, files: stale, phone: PHONE, projects });
    expect(rules(result)).toContain('placeholders');
  });
});

describe('the phone number', () => {
  it('fails when it is pasted into a bullet, without repeating it', async () => {
    const pasted = changed((c) => (c.experience[0]!.work[0]!.points[0] += ` ${PHONE}`));
    const stale = await make({ source: pasted });
    const result = checkParity({ resume, files: stale, phone: PHONE, projects });
    const phone = result.failures.filter((f) => f.rule === 'phone');
    expect(phone.length).toBeGreaterThan(0);
    expect(phone.map((f) => f.message).join()).toMatch(
      /in 2 paragraphs; it should be in one, the contact line|written 2 times/,
    );
    for (const failure of result.failures) expect(failure.message).not.toContain(NINE);
  });

  it('fails when it is in a paragraph that is not the contact line', async () => {
    const pasted = changed((c) => (c.intro[0] = `Call ${PHONE}`));
    const stale = await make({ source: pasted, phone: PHONE_ON_REQUEST });
    const result = checkParity({ resume, files: stale, phone: PHONE, projects });
    const messages = result.failures.filter((f) => f.rule === 'phone').map((f) => f.message);
    expect(messages.join()).toMatch(/Normal paragraph, not in the contact line|written \d+ times/);
  });

  it('fails when the file has another number than the private file', async () => {
    const other = ['0', NINE.slice(8), NINE.slice(0, 8)].join('');
    const stale = await make({ phone: other });
    const result = checkParity({ resume, files: stale, phone: PHONE, projects });
    expect(result.failures.some((f) => f.rule === 'phone' && /written 0 times/.test(f.message))).toBe(true);
    for (const failure of result.failures) expect(failure.message).not.toContain(NINE);
  });

  it('fails in a dry run if a number is there', () => {
    const result = run({ dryRun: true, phone: undefined });
    const named = result.failures.filter((f) => f.rule === 'phone').map((f) => f.file);
    expect([...new Set(named)]).toEqual(['CV.docx', 'Portfolio.docx']);
    expect(result.failures[0]!.message).toMatch(/dry run has a phone number/);
  });

  it('fails when it is in the footer or a tel: link is left in a dry run', async () => {
    const dry = await make({ phone: PHONE_ON_REQUEST });
    expect(
      checkParity({
        resume,
        files: { cv: { ...dry.cv, footer: PHONE }, portfolio: dry.portfolio },
        dryRun: true,
        projects,
      }).failures[0]!.message,
    ).toBe('a phone number is in the footer');
    const link = { ...dry.cv, rels: '<Relationship Target="tel:+1" TargetMode="External"/>' };
    expect(
      checkParity({ resume, files: { cv: link }, dryRun: true, projects }).failures.map((f) => f.message),
    ).toContain('the dry run has a tel: link, and should have none');
  });
});

describe('the portfolio', () => {
  it('fails when its projects are not those of the private file, in either direction', () => {
    const more = [...projects, { ...projects[0]!, name: 'A project that is new' }];
    expect(run({ projects: more }).failures.find((f) => f.rule === 'portfolio-projects')!.message).toMatch(
      /missing: "A project that is new/,
    );
    const fewer = projects.slice(1);
    expect(run({ projects: fewer }).failures.find((f) => f.rule === 'portfolio-projects')!.message).toMatch(
      /not in cv\/private\.json any more/,
    );
  });

  it('fails when the role under a company of the site is not the role of the site', () => {
    const result = run({
      resume: changed(
        (c) => (c.experience.find((r) => r.company === 'NewIT Vietnam')!.title = 'Another title'),
      ),
    });
    expect(result.failures.find((f) => f.rule === 'portfolio-roles')!.message).toMatch(
      /roles under the companies missing/,
    );
  });

  it('fails when a fact marked private-only is not in the portfolio, or is on the site too', () => {
    const missing = projects.map((p, i) => (i === 0 ? { ...p, privateOnly: ['a fact nobody wrote'] } : p));
    expect(run({ projects: missing }).failures.find((f) => f.rule === 'private-only')!.message).toMatch(
      /not in the portfolio/,
    );
    const onSite = projects.map((p, i) =>
      i === 0 ? { ...p, privateOnly: [resume.experience[0]!.company] } : p,
    );
    expect(
      run({ projects: onSite }).failures.some(
        (f) => f.rule === 'private-only' && /the site says it too/.test(f.message),
      ),
    ).toBe(true);
  });

  it('fails when a project or a date of the old appendix is lost', async () => {
    const lost = [
      ...projects,
      { ...projects[0]!, name: 'Lost project', title: undefined, privateOnly: undefined },
    ];
    const old = (await make({ list: lost })).portfolio;
    const result = run({ master: { ...old, name: 'Master.docx' } });
    expect(result.failures.find((f) => f.rule === 'old-appendix')!.message).toMatch(
      /a project of the old appendix missing: "Lost project/,
    );
    const dated = {
      ...old,
      paragraphs: [
        ...old.paragraphs,
        { style: 'Normal', text: `Some Company  Some Title\tJan 1999 – Feb 2001`, inTable: false },
      ],
    };
    // A project and a date lost are two problems, each its own message.
    const messages = run({ master: dated })
      .failures.filter((f) => f.rule === 'old-appendix')
      .map((f) => f.message);
    expect(messages).toHaveLength(2);
    expect(messages.join('\n')).toContain('"Jan 1999 – Feb 2001"');
  });

  it('is not checked when there is no portfolio', async () => {
    const cvOnly = { cv: files.cv };
    const result = checkParity({ resume, files: cvOnly, phone: PHONE });
    expect(result.failures).toEqual([]);
    expect(result.passed.every((p) => p.file === 'CV.docx')).toBe(true);
    expect(result.differences.join()).toMatch(/project portfolio: none/);
  });
});
