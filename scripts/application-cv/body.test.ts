import { beforeAll, describe, expect, it } from 'vitest';
import { Document, type IPropertiesOptions, type ISectionOptions, type Paragraph } from 'docx';
import { resume } from '../../src/content/resume';
import type { Resume } from '../../src/content/types';
import { formatRange } from '../../src/lib/dates';
import { emphasis, stripEmphasis } from '../../src/lib/emphasis';
import { displayUrl } from '../../src/lib/urls';
import { paragraphXml, paragraphs, styleOf, unpack, type DocxParts } from './docxParts';

interface Body {
  buildBody(resume: Resume): Paragraph[];
}
interface Sheet {
  PAGE: NonNullable<ISectionOptions['properties']>['page'];
  createStyles(): Pick<IPropertiesOptions, 'styles' | 'numbering'>;
}

// The modules are plain JavaScript; computed specifiers keep the type checker out of them.
const bodyPath = './body.mjs';
const stylesPath = './styles.mjs';
const { buildBody } = (await import(bodyPath)) as Body;
const { PAGE, createStyles } = (await import(stylesPath)) as Sheet;

let doc: DocxParts;
let xml: string[];
let text: string[];
beforeAll(async () => {
  doc = await unpack(
    new Document({
      ...createStyles(),
      sections: [{ properties: { page: PAGE }, children: buildBody(resume) }],
    }),
  );
  xml = paragraphXml(doc.body);
  text = paragraphs(doc.body);
});

/** The paragraphs from the Heading 1 named `title` up to the next Heading 1, the heading itself first. */
function section(title: string) {
  const start = xml.findIndex((p, i) => styleOf(p) === 'Heading1' && text[i] === title);
  if (start < 0) throw new Error(`no section ${title}`);
  const next = xml.findIndex((p, i) => i > start && styleOf(p) === 'Heading1');
  const end = next < 0 ? xml.length : next;
  return { xml: xml.slice(start, end), text: text.slice(start, end) };
}

const newestFirst = [...resume.experience].sort((a, b) => b.start.localeCompare(a.start));
const strongRuns = (paragraph: string) => paragraph.match(/<w:rStyle w:val="Strong"\/>/g)?.length ?? 0;

describe('body of the application CV', () => {
  it('has the sections of V1-20.3 in order', () => {
    const headings = xml.flatMap((p, i) => (styleOf(p) === 'Heading1' ? [text[i]] : []));
    expect(headings).toEqual([
      'Summary',
      'Technical Skills',
      'Experience',
      'Public work',
      'How I work',
      'Education',
      'Languages',
    ]);
  });

  it('opens with the career figures as one line, each value in the Figure style', () => {
    expect(text[0]).toBe(resume.metrics.map((m) => `${m.value} ${m.label}`).join(' · '));
    expect(xml[0]!.match(/<w:rStyle w:val="Figure"\/>/g)).toHaveLength(resume.metrics.length);
    for (const value of ['7+', '5+', '3+', '~50', '~10k']) expect(text[0]).toContain(value);
  });

  it('gives the summary paragraphs as written', () => {
    expect(section('Summary').text.slice(1)).toEqual(resume.intro);
  });

  it('writes one Label: item, item line per skill group, with the label in bold', () => {
    const skills = section('Technical Skills');
    expect(skills.text.slice(1)).toEqual(resume.skills.map((g) => `${g.name}: ${g.items.join(', ')}`));
    for (const line of skills.xml.slice(1)) expect(strongRuns(line)).toBe(1);
  });

  it('lists the roles newest first, each as company and dates with its title under it', () => {
    const experience = section('Experience');
    const heads = experience.xml.flatMap((p, i) => (styleOf(p) === 'Heading2' ? [experience.text[i]] : []));
    expect(heads).toEqual(
      newestFirst.map((r) => `${r.company}${formatRange(r.start, r.end).replace('present', 'Present')}`),
    );
    const titles = experience.xml.flatMap((p, i) => (styleOf(p) === 'RoleTitle' ? [experience.text[i]] : []));
    expect(titles).toEqual(newestFirst.map((r) => r.title));
    expect(experience.xml.filter((p) => styleOf(p) === 'Heading2').every((p) => p.includes('<w:tab/>'))).toBe(
      true,
    );
  });

  it('runs each named engagement into its context in bold', () => {
    const experience = section('Experience');
    const engagements = newestFirst.flatMap((r) => r.work).filter((w) => w.name);
    expect(engagements.length).toBeGreaterThan(1);
    for (const w of engagements) {
      const lead = w.context ? `${w.name}. ${w.context}` : w.name!;
      const at = experience.text.indexOf(lead);
      expect(at, lead).toBeGreaterThan(0);
      expect(experience.xml[at]).toMatch(new RegExp(`<w:rStyle w:val="Strong"/></w:rPr><w:t[^>]*>${w.name}`));
    }
  });

  it('writes every bullet as a real list paragraph with its key phrases in bold, and no asterisks', () => {
    const points = [
      ...newestFirst.flatMap((r) => r.work.flatMap((w) => w.points)),
      ...resume.leadership.owns,
    ];
    const bullets = xml.map((p, i) => ({ p, t: text[i]! })).filter(({ p }) => styleOf(p) === 'ListBullet');
    expect(bullets.map((b) => b.t)).toEqual(points.map(stripEmphasis));
    bullets.forEach(({ p }, i) => {
      expect(strongRuns(p), points[i]).toBe(emphasis(points[i]!).filter((part) => part.strong).length);
    });
    expect(doc.body).not.toContain('**');
    expect(doc.body).not.toMatch(/undefined|\[object/);
  });

  it('keeps a role on one page when it fits: each paragraph with the next, the last one free', () => {
    const experience = section('Experience');
    const keeps = (p: string) =>
      p.includes('<w:keepNext/>') || ['Heading1', 'Heading2', 'RoleTitle'].includes(styleOf(p) ?? '');
    const starts = experience.xml.flatMap((p, i) => (styleOf(p) === 'Heading2' ? [i] : []));
    starts.forEach((from, n) => {
      const block = experience.xml.slice(from, starts[n + 1] ?? experience.xml.length);
      expect(keeps(block.at(-1)!), `end of role ${n}`).toBe(false);
      if (newestFirst[n]!.work.length === 1) {
        block.slice(0, -1).forEach((p, i) => expect(keeps(p), `role ${n}, paragraph ${i}`).toBe(true));
      }
      for (const p of block) expect(p).toContain('<w:keepLines/>');
    });
  });

  it('gives each public repository one line: name, lead figure and address as a link', () => {
    const work = section('Public work');
    expect(work.text.slice(1)).toHaveLength(resume.projects.length);
    resume.projects.forEach((project, i) => {
      const line = work.text[i + 1]!;
      const lead = project.stat ?? project.caseStudy?.does.lead.figure;
      expect(line.startsWith(project.name), line).toBe(true);
      if (lead) expect(line).toContain(`${lead.value} – ${lead.label}`);
      expect(line.endsWith(displayUrl(project.repo)), line).toBe(true);
      expect(doc.rels).toContain(`Target="${project.repo}"`);
    });
  });

  it('shows the scope figures, what I own and each principle with its first evidence line', () => {
    const approach = section('How I work');
    expect(approach.text[1]).toBe(resume.leadership.figures.map((f) => `${f.value} ${f.label}`).join(' · '));
    expect(approach.text[2]).toBe('What I own');
    for (const own of resume.leadership.owns) expect(approach.text).toContain(own);
    for (const principle of resume.principles) {
      const at = approach.text.indexOf(`${principle.title}. ${principle.body}`);
      expect(at, principle.title).toBeGreaterThan(0);
      const [evidence] = principle.evidence;
      expect(approach.text[at + 1]).toBe(`In practice: ${evidence!.text} (${evidence!.source})`);
      expect(styleOf(approach.xml[at + 1]!)).toBe('Caption');
    }
  });

  it('closes with education and the two languages in the words of the content file', () => {
    const { school, detail, start, end } = resume.education;
    expect(section('Education').text.slice(1)).toEqual([school, `${detail} (${start}–${end})`]);
    const languages = section('Languages').text.slice(1);
    expect(languages).toEqual(
      resume.languages.flatMap((l) => [`${l.name} · ${l.level}`, ...(l.detail ? [l.detail] : [])]),
    );
    expect(languages.join(' ')).not.toMatch(/actively improving/i);
  });

  it('has no table, text box or picture, and no direct colour or size', () => {
    expect(doc.body).not.toMatch(/<w:tbl>|<w:txbxContent|<w:pict|<w:drawing|<mc:AlternateContent/);
    expect(doc.body).not.toMatch(/<w:(?:color|sz|szCs) /);
    expect(doc.media).toHaveLength(0);
  });
});
