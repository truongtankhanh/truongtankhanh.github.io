import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Document } from 'docx';
import { resume } from '../../src/content/resume';
import type { Resume } from '../../src/content/types';
import { paragraphXml, paragraphs, styleOf, unpack, type DocxParts } from './docxParts';

interface Project {
  name: string;
  company: string;
  duration: string;
  tableRole: string;
  role: string;
  source: string;
}
interface Input {
  resume: Resume;
  phone: string;
  logo: Buffer;
  projects: Project[];
}
interface Combined {
  PART_TITLE: string;
  COMBINED_PROPERTIES: { title: string; creator: string; description: string };
  combinedFileName(resume: Pick<Resume, 'cvPdf'>): string;
  buildCombinedDocument(input: Input): Document;
}

// The modules are plain JavaScript; computed specifiers keep the type checker out of them.
const combinedPath = './combined.mjs';
const cvPath = './cv.mjs';
const portfolioPath = './portfolio.mjs';
const headerPath = './header.mjs';
const { PART_TITLE, COMBINED_PROPERTIES, combinedFileName, buildCombinedDocument } = (await import(
  combinedPath
)) as Combined;
const { buildCvDocument } = (await import(cvPath)) as {
  buildCvDocument(input: Omit<Input, 'projects'>): Document;
};
const { buildPortfolioDocument, PORTFOLIO_TITLE } = (await import(portfolioPath)) as {
  buildPortfolioDocument(input: Input): Document;
  PORTFOLIO_TITLE: string;
};
const { LOGO_FILE } = (await import(headerPath)) as { LOGO_FILE: URL };

// Put together here and not written out, so no number appears in this file.
const NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9].join('');
const PHONE = ['0', NINE.slice(0, 2), NINE.slice(2, 5), NINE.slice(5)].join(' ');
const logo = readFileSync(LOGO_FILE);
const { extraProjects: projects } = JSON.parse(
  readFileSync(new URL('./private.example.json', import.meta.url), 'utf8'),
) as { extraProjects: Project[] };

/** The paragraphs of the first-page block: location, name, role and the two contact lines. */
const BLOCK = 5;

let doc: DocxParts;
let cv: DocxParts;
let portfolio: DocxParts;
beforeAll(async () => {
  doc = await unpack(buildCombinedDocument({ resume, phone: PHONE, logo, projects }));
  cv = await unpack(buildCvDocument({ resume, phone: PHONE, logo }));
  portfolio = await unpack(buildPortfolioDocument({ resume, phone: PHONE, logo, projects }));
});

describe('combinedFileName', () => {
  it('is the name of the public CV with _CV_and_Portfolio.docx', () => {
    expect(combinedFileName(resume)).toBe('Truong_Tan_Khanh_CV_and_Portfolio.docx');
  });

  it.each(['CV.pdf', 'Trương_CV.pdf', 'a b_CV.pdf', ''])('refuses %j', (cvPdf) => {
    expect(() => combinedFileName({ cvPdf })).toThrow(/Cannot make a combined file name/);
  });
});

describe('the one-file edition', () => {
  it('has its own title, the same author, and the owner as the only picture', () => {
    expect(doc.core).toContain(`<dc:title>${COMBINED_PROPERTIES.title}</dc:title>`);
    expect(doc.core).toContain(`<dc:creator>${COMBINED_PROPERTIES.creator}</dc:creator>`);
    expect(doc.media).toHaveLength(1);
    expect(doc.body.match(/<w:drawing>/g)).toHaveLength(1);
  });

  it('is the CV, then the title of the portfolio, then the portfolio without its first-page block', () => {
    const text = paragraphs(doc.body);
    const cvText = paragraphs(cv.body);
    const portfolioText = paragraphs(portfolio.body).slice(BLOCK);
    expect(text).toEqual([...cvText, PART_TITLE, ...portfolioText]);
    expect(PART_TITLE).toBe(PORTFOLIO_TITLE);
  });

  it('writes the first-page block once: one name, one role, two contact lines, and the portfolio title in the Part style', () => {
    const styles = paragraphXml(doc.body).map((p) => styleOf(p));
    const count = (style: string) => styles.filter((s) => s === style).length;
    expect(count('Title')).toBe(1);
    expect(count('Subtitle')).toBe(1);
    expect(count('Contact')).toBe(2);
    expect(count('Location')).toBe(1);
    expect(count('Part')).toBe(1);
    expect(styles.indexOf('Part')).toBeGreaterThan(styles.lastIndexOf('Contact'));
  });

  it('has the sections of the CV, then the portfolio overview and each company, in that order', () => {
    const headings = paragraphXml(doc.body).flatMap((p, i) =>
      styleOf(p) === 'Heading1' ? [paragraphs(doc.body)[i]] : [],
    );
    expect(headings).toEqual([
      'Summary',
      'Technical Skills',
      'Experience',
      'Public work',
      'How I work',
      'Education and languages',
      'Project overview',
      'NewIT Vietnam',
      'Personal project',
    ]);
  });

  it('is one section with the one footer, which counts the pages of the whole file', () => {
    expect(doc.body.match(/<w:sectPr>/g)).toHaveLength(1);
    expect(doc.footer).toContain('NUMPAGES');
    expect(doc.footer).not.toContain(PHONE);
  });

  it('writes the phone number once, in the contact line, and has one table, the overview', () => {
    expect(doc.body.split(PHONE)).toHaveLength(2);
    expect(paragraphs(doc.body)[3]!.startsWith(PHONE)).toBe(true);
    expect(doc.body.match(/<w:tbl>/g)).toHaveLength(1);
    expect(doc.body).not.toMatch(/<w:txbxContent|<w:pict|<mc:AlternateContent/);
    expect(doc.body).not.toMatch(/<w:(?:color|sz|szCs) /);
    expect(doc.body).not.toMatch(/undefined|\[object/);
  });

  it('refuses to be made without a project', () => {
    expect(() => buildCombinedDocument({ resume, phone: PHONE, logo, projects: [] })).toThrow(
      /at least one project/,
    );
  });
});
