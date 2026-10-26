import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Document } from 'docx';
import { resume } from '../../src/content/resume';
import type { Resume } from '../../src/content/types';
import { formatRange } from '../../src/lib/dates';
import { paragraphXml, paragraphs, styleOf, unpack, type DocxParts } from './docxParts';

interface Project {
  name: string;
  title?: string;
  company: string;
  duration: string;
  tableRole: string;
  role: string;
  overview?: string;
  team?: string;
  stack?: string;
  responsibilities?: string[];
  source: string;
}
interface Portfolio {
  PORTFOLIO_TITLE: string;
  portfolioSubtitle(resume: Resume): string;
  PORTFOLIO_PROPERTIES: { title: string; creator: string; description: string };
  portfolioFileName(resume: Pick<Resume, 'cvPdf'>): string;
  buildPortfolioDocument(input: {
    resume: Resume;
    phone: string;
    logo: Buffer;
    projects: Project[];
  }): Document;
}
interface Header {
  LOGO_FILE: URL;
}

// The modules are plain JavaScript; computed specifiers keep the type checker out of them.
const portfolioPath = './portfolio.mjs';
const headerPath = './header.mjs';
const {
  PORTFOLIO_TITLE,
  portfolioSubtitle,
  PORTFOLIO_PROPERTIES,
  portfolioFileName,
  buildPortfolioDocument,
} = (await import(portfolioPath)) as Portfolio;
const { LOGO_FILE } = (await import(headerPath)) as Header;

// Put together here and not written out, so no number appears in this file.
const NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9].join('');
const PHONE = ['0', NINE.slice(0, 2), NINE.slice(2, 5), NINE.slice(5)].join(' ');
const logo = readFileSync(LOGO_FILE);

/** The made-up projects of the example file (one of a company on the site, one personal), and one with the least. */
const example = JSON.parse(readFileSync(new URL('./private.example.json', import.meta.url), 'utf8')) as {
  extraProjects: Project[];
};
const bare: Project = {
  name: 'A bare project',
  company: 'Surbana Jurong',
  duration: 'Ongoing',
  tableRole: 'Developer',
  role: 'Developer',
  source: 'made up',
};
const projects = [...example.extraProjects, bare];

let doc: DocxParts;
let xml: string[];
let text: string[];
beforeAll(async () => {
  doc = await unpack(buildPortfolioDocument({ resume, phone: PHONE, logo, projects }));
  xml = paragraphXml(doc.body);
  text = paragraphs(doc.body);
});

const strongRuns = (paragraph: string) => paragraph.match(/<w:rStyle w:val="Strong"\/>/g)?.length ?? 0;
/** The paragraphs from the one whose text is `title` and style is `style`, up to (not including) the next Heading 1. */
function from(title: string, style: string) {
  const start = xml.findIndex((p, i) => styleOf(p) === style && text[i] === title);
  if (start < 0) throw new Error(`no ${style} ${title}`);
  const next = xml.findIndex((p, i) => i > start && styleOf(p) === 'Heading1');
  const end = next < 0 ? xml.length : next;
  return { xml: xml.slice(start, end), text: text.slice(start, end) };
}

describe('portfolioFileName', () => {
  it('is the name of the public CV with _Project_Portfolio.docx', () => {
    expect(portfolioFileName(resume)).toBe('Truong_Tan_Khanh_Project_Portfolio.docx');
  });

  it.each(['CV.pdf', 'Trương_CV.pdf', 'a b_CV.pdf', ''])('refuses %j', (cvPdf) => {
    expect(() => portfolioFileName({ cvPdf })).toThrow(/Cannot make a portfolio file name/);
  });
});

describe('portfolio document', () => {
  it('has its own title, the same author, and the owner as the only picture', () => {
    expect(doc.core).toContain(`<dc:title>${PORTFOLIO_PROPERTIES.title}</dc:title>`);
    expect(doc.core).toContain(`<dc:creator>${PORTFOLIO_PROPERTIES.creator}</dc:creator>`);
    expect(PORTFOLIO_PROPERTIES.title).toBe('Truong Tan Khanh, Project Portfolio');
    expect(doc.media).toHaveLength(1);
  });

  it('opens like the CV, with the role of the site and the name of the file under the name', () => {
    expect(text[1]).toBe(resume.name);
    expect(text[2]).toBe(portfolioSubtitle(resume));
    expect(text[2]).toBe(`${resume.headline} · Project Portfolio`);
    expect(PORTFOLIO_TITLE).toBe('Project Portfolio');
    expect(styleOf(xml[2]!)).toBe('Subtitle');
    expect(text[3]).toContain(resume.email);
  });

  it('writes the phone number once, in the contact line, and not in the footer', () => {
    expect(doc.body.split(PHONE)).toHaveLength(2);
    expect(text[3]!.startsWith(PHONE)).toBe(true);
    expect(doc.footer).not.toContain(PHONE);
    expect(paragraphs(doc.footer)[0]).toMatch(new RegExp(`^${resume.name} · ${resume.headline}`));
    expect(doc.footer).toContain('NUMPAGES');
  });

  it('counts the projects on the strip under the band, with the numbers in the Figure style', () => {
    expect(text[5]).toBe('3 projects across 3 organisations');
    expect(styleOf(xml[5]!)).toBe('FigureStrip');
    expect(xml[5]!.match(/<w:rStyle w:val="Figure"\/>/g)).toHaveLength(2);
  });

  it('lists the projects under their companies, in the order the private file gives them', () => {
    const headings = xml.flatMap((p, i) => (styleOf(p) === 'Heading1' ? [text[i]] : []));
    expect(headings).toEqual(['Project overview', 'NewIT Vietnam', 'Personal project', 'Surbana Jurong']);
  });

  it('heads a company of the site with the title and dates of its role, and any other with its name alone', () => {
    const newit = resume.experience.find((r) => r.company === 'NewIT Vietnam')!;
    const surbana = resume.experience.find((r) => r.company === 'Surbana Jurong')!;
    expect(from('NewIT Vietnam', 'Heading1').text[1]).toBe(
      `${newit.title} · ${formatRange(newit.start, newit.end).replace('present', 'Present')}`,
    );
    expect(from('Surbana Jurong', 'Heading1').text[1]).toBe(
      `${surbana.title} · ${formatRange(surbana.start, surbana.end).replace('present', 'Present')}`,
    );
    // The summary of the role, as the site words it, follows the title and is kept with the first project.
    for (const [company, role] of [
      ['NewIT Vietnam', newit],
      ['Surbana Jurong', surbana],
    ] as const) {
      const block = from(company, 'Heading1');
      expect(role.summary).toBeTruthy();
      expect(block.text[2]).toBe(role.summary);
      expect(block.xml[2]).toContain('<w:keepNext/>');
      expect(styleOf(block.xml[3]!)).toBe('Heading2');
    }
    expect(styleOf(from('Personal project', 'Heading1').xml[1]!)).toBe('Heading2');
  });
});

describe('overview table', () => {
  const table = () => /<w:tbl>.*<\/w:tbl>/s.exec(doc.body)![0];
  const rows = () => [...table().matchAll(/<w:tr[ >].*?<\/w:tr>/gs)].map((r) => r[0]);
  const cells = (row: string) =>
    [...row.matchAll(/<w:tc>.*?<\/w:tc>/gs)].map((c) =>
      [...c[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((t) => t[1]).join(''),
    );

  it('is the only table, with a header row and one row per project', () => {
    expect(doc.body.match(/<w:tbl>/g)).toHaveLength(1);
    expect(rows()).toHaveLength(1 + projects.length);
    expect(cells(rows()[0]!)).toEqual(['Project', 'Company', 'Duration', 'Role']);
    rows()
      .slice(1)
      .forEach((row, i) => {
        const p = projects[i]!;
        expect(cells(row)).toEqual([p.name, p.company, p.duration, p.tableRole]);
      });
  });

  it('has real header cells that repeat on every page, and rows that do not split', () => {
    expect(rows()[0]).toContain('<w:tblHeader');
    expect(table().match(/<w:tblHeader/g)).toHaveLength(1);
    for (const row of rows()) expect(row).toContain('<w:cantSplit');
  });

  it('has a steel rule under the header, a thinner one under each row, and no shading, no merged cell and no other rule', () => {
    const [header, ...body] = rows();
    expect(header!.match(/<w:bottom [^>]*w:color="A9B8CD"/g)).toHaveLength(4);
    expect(header).toMatch(/<w:bottom [^>]*w:sz="6"/);
    for (const row of body) {
      expect(row.match(/<w:bottom [^>]*w:color="A9B8CD"/g)).toHaveLength(4);
      expect(row).toMatch(/<w:bottom [^>]*w:sz="2"/);
    }
    // The margins of a cell are `<w:top w:type=...>`; a rule is one that has a `w:val` (its style).
    for (const row of rows()) expect(row).not.toMatch(/<w:(?:top|left|right) [^>]*w:val=/);
    expect(table()).not.toMatch(/<w:shd|gridSpan|vMerge|hMerge/);
  });

  it('sets the cells in the Table Text style, so a row is one line', () => {
    for (const row of rows().slice(1)) expect(row.match(/<w:pStyle w:val="TableText"\/>/g)).toHaveLength(4);
  });

  it('sits between the heading of the overview and the first company', () => {
    const at = doc.body.indexOf('<w:tbl>');
    expect(doc.body.lastIndexOf('Project overview', at)).toBeGreaterThan(0);
    expect(doc.body.indexOf('NewIT Vietnam', doc.body.indexOf('</w:tbl>'))).toBeGreaterThan(at);
  });
});

describe('project blocks', () => {
  it('head each project with its title (else its name) and the duration at the right', () => {
    const [full, personal] = example.extraProjects as [Project, Project];
    const newit = from('NewIT Vietnam', 'Heading1');
    const heading = newit.xml.findIndex((p) => styleOf(p) === 'Heading2');
    expect(newit.text[heading]).toBe(`${full.title}${full.duration}`);
    expect(newit.xml[heading]).toContain('<w:tab/>');
    expect(newit.xml[heading]).toContain('<w:rStyle w:val="DateRun"/>');
    // No role line under a company that is not on the site: the project follows its heading.
    expect(from('Personal project', 'Heading1').text[1]).toBe(`${personal.name}${personal.duration}`);
  });

  it('write the overview as it is, then Role, Team and Stack in a label column, and what is missing is left out', () => {
    const [full] = example.extraProjects as [Project];
    const block = from('NewIT Vietnam', 'Heading1');
    const at = block.text.findIndex((t) => t === full.overview);
    expect(at).toBeGreaterThan(0);
    expect(block.text.slice(at, at + 4)).toEqual([
      full.overview,
      `Role${full.role}`,
      `Team${full.team}`,
      `Stack${full.stack}`,
    ]);
    // The tab between a label and its text is not in the text this reads; the label is bold, in a Field row.
    for (const line of block.xml.slice(at + 1, at + 4)) {
      expect(strongRuns(line)).toBe(1);
      expect(styleOf(line)).toBe('Field');
      expect(line).toContain('<w:tab/>');
    }
    // The bare project has a role and nothing else: one row, no label for what it lacks.
    const bareBlock = from('Surbana Jurong', 'Heading1');
    expect(bareBlock.xml.filter((p) => styleOf(p) === 'Field')).toHaveLength(1);
    expect(bareBlock.text).toContain(`Role${bare.role}`);
    expect(bareBlock.text).not.toContain('Responsibilities');
  });

  it('list the responsibilities as real bullets, with key phrases in bold', () => {
    const [full] = example.extraProjects as [Project];
    const block = from('NewIT Vietnam', 'Heading1');
    const at = block.text.indexOf('Responsibilities');
    expect(at).toBeGreaterThan(0);
    expect(block.text.slice(at + 1)).toEqual([
      'Built the first made-up feature.',
      'Reviewed the code of the team.',
    ]);
    for (const bullet of block.xml.slice(at + 1)) expect(styleOf(bullet)).toBe('ListBullet');
    expect(strongRuns(block.xml[at + 1]!)).toBe(1);
    expect(full.responsibilities).toHaveLength(2);
    expect(doc.body).not.toContain('**');
  });

  it('keep the head of a block together on a page and let the bullets run on: only the head is kept with the next', () => {
    const keeps = (p: string) =>
      p.includes('<w:keepNext/>') || ['Heading1', 'Heading2', 'RoleTitle'].includes(styleOf(p) ?? '');
    const block = from('NewIT Vietnam', 'Heading1').xml.slice(3); // from the first Heading 2
    expect(styleOf(block[0]!)).toBe('Heading2');
    const bullets = block.findIndex((p) => styleOf(p) === 'ListBullet');
    expect(bullets).toBeGreaterThan(1);
    block.slice(0, bullets).forEach((p, i) => expect(keeps(p), `head ${i}`).toBe(true));
    block.slice(bullets).forEach((p, i) => expect(keeps(p), `bullet ${i}`).toBe(false));
    // A project without bullets ends its head free, so the next one can start a page.
    const bareBlock = from('Surbana Jurong', 'Heading1').xml.slice(3);
    expect(keeps(bareBlock.at(-1)!)).toBe(false);
  });
});

describe('what a portfolio is made of', () => {
  it('has no text box, no extra picture and no direct colour or size', () => {
    expect(doc.body).not.toMatch(/<w:txbxContent|<w:pict|<mc:AlternateContent/);
    expect(doc.body.match(/<w:drawing>/g)).toHaveLength(1);
    expect(doc.body).not.toMatch(/<w:(?:color|sz|szCs) /);
    expect(doc.body).not.toMatch(/undefined|\[object/);
  });

  it('refuses to be made without a project', () => {
    expect(() => buildPortfolioDocument({ resume, phone: PHONE, logo, projects: [] })).toThrow(
      /at least one project/,
    );
  });
});
