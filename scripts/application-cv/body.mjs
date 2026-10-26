// The body of the application CV (V1-20.3), one function per block, as `docx` paragraphs in the named styles of
// `styles.mjs`. It is one column in the reading order of the Word edition: career figures, Summary, Technical Skills,
// Experience, Public work, How I work, Education and languages. No table, no text box and no picture, so an applicant
// tracking system reads it as plain text in order. A "label, then text in its own column" row is a hanging indent and a
// tab, not a table.
//
// `resume` is the content of `src/content/resume.ts` as a plain object, and every word comes from it; this module adds
// only the headings and the labels. It holds no phone number and no secret.
import { ExternalHyperlink, Paragraph, Tab, TextRun } from 'docx';
import { STYLE } from './styles.mjs';
import { displayUrl, emphasis, formatRange } from './text.mjs';

const SEPARATOR = ' · ';

export const strong = (text) => new TextRun({ text, style: STYLE.strong });
export const figure = (text) => new TextRun({ text, style: STYLE.figure });
const link = (text, href) =>
  new ExternalHyperlink({ link: href, children: [new TextRun({ text, style: STYLE.hyperlink })] });

/** The runs of a text whose `**key phrases**` are bold. */
export const rich = (text) =>
  emphasis(text).map((part) => (part.strong ? strong(part.text) : new TextRun(part.text)));

const tab = () => new TextRun({ children: [new Tab()] });

/** A row of a label column: the bold label, a tab, then the runs of the text. A row of no label keeps the column. */
export const row = (style, label, runs) => ({
  style,
  children: [...(label ? [strong(label)] : []), tab(), ...runs],
});

/** Groups of runs written one after the other, separated by a middle dot. */
const joined = (groups) =>
  groups.flatMap((group, i) => (i === 0 ? group : [new TextRun(SEPARATOR), ...group]));

/** A section title, in the Heading 1 style, which carries the capitals and the steel rule. */
export const heading = (text) => new Paragraph({ style: STYLE.heading1, children: [new TextRun(text)] });

export const bullet = (text) => ({ style: STYLE.bullet, children: rich(text) });

/**
 * Paragraphs that stay on one page when they fit on one: none is split, and each is kept with the next, except the last.
 * `blocks` are the options of `Paragraph`, not yet built.
 */
export const keepTogether = (blocks) =>
  blocks.map(
    (options, i) =>
      new Paragraph({ ...options, keepLines: true, ...(i < blocks.length - 1 && { keepNext: true }) }),
  );

/**
 * The words of each career figure on the strip, shorter than the site's so the five fit one row; a label that is not
 * here is written in full, so a new figure on the site still appears (and may wrap, which the render shows).
 */
const SHORT_LABELS = {
  'years shipping production software': 'years in production',
  'marketplaces integrated': 'marketplaces',
  'repositories and services': 'repos and services',
  'messages on one replica': 'per replica',
};

/** "7+ years in production": a figure of the site as the strip writes it. */
export const figureText = (figure) => `${figure.value} ${SHORT_LABELS[figure.label] ?? figure.label}`;

/** "7+ years in production · 5+ marketplaces · ...": each value in bold accent, on the strip under the band. */
export function buildFigures(resume) {
  return [
    new Paragraph({
      style: STYLE.figureStrip,
      children: joined(
        resume.metrics.map((f) => [figure(f.value), new TextRun(figureText(f).slice(f.value.length))]),
      ),
    }),
  ];
}

export function buildSummary(resume) {
  return [
    heading('Summary'),
    ...resume.intro.map((text) => new Paragraph({ children: [new TextRun(text)] })),
  ];
}

/** One row per group of the site: the group in a bold label column, its items beside it. */
export function buildSkills(resume) {
  return [
    heading('Technical Skills'),
    ...resume.skills.map(
      (group) => new Paragraph(row(STYLE.row, group.name, [new TextRun(group.items.join(', '))])),
    ),
  ];
}

/** The bold name of an engagement, run into its context, then its bullets. */
function engagementBlocks(engagement) {
  const lead = [];
  if (engagement.name) lead.push(strong(engagement.context ? `${engagement.name}.` : engagement.name));
  if (engagement.context)
    lead.push(new TextRun(engagement.name ? ` ${engagement.context}` : engagement.context));
  return [...(lead.length > 0 ? [{ children: lead }] : []), ...engagement.points.map(bullet)];
}

/**
 * Newest first. A role is one block, which a page break does not split when it fits on one page; a role of several
 * engagements may break between them, so a long current role cannot leave a page half empty (as on the site).
 */
export function buildExperience(resume) {
  const roles = [...resume.experience].sort((a, b) => b.start.localeCompare(a.start));
  return [
    heading('Experience'),
    ...roles.flatMap((role) => {
      const head = [
        {
          style: STYLE.heading2,
          children: [
            new TextRun(role.company),
            new TextRun({ children: [new Tab()] }),
            new TextRun({ text: formatRange(role.start, role.end), style: STYLE.dateRun }),
          ],
        },
        { style: STYLE.roleTitle, children: [new TextRun(role.title)] },
        ...(role.summary ? [{ children: [new TextRun(role.summary)] }] : []),
      ];
      const [first = [], ...rest] = role.work.map(engagementBlocks);
      return [...keepTogether([...head, ...first]), ...rest.flatMap(keepTogether)];
    }),
  ];
}

/**
 * Every repository leads with one figure: its own, or else the one its case study leads with. A repository is two
 * lines, the name with its figure and then its address, so an address never has to wrap in the middle of a word.
 */
export function buildPublicWork(resume) {
  return [
    heading('Public work'),
    ...resume.projects.flatMap((project) => {
      const lead = project.stat ?? project.caseStudy?.does.lead.figure;
      return [
        new Paragraph({
          style: STYLE.repo,
          children: joined([
            [strong(project.name)],
            ...(lead ? [[figure(lead.value), new TextRun(` – ${lead.label}`)]] : []),
          ]),
        }),
        new Paragraph({
          style: STYLE.repoLink,
          children: [link(displayUrl(project.repo), project.repo)],
        }),
      ];
    }),
  ];
}

/**
 * Each principle in one paragraph. Three things the site shows here are left out of this edition because the CV says
 * them already: the line of figures (the strip under the name has them), the "In practice" evidence of each principle
 * (it repeats a bullet of the experience word for word) and "What I own" (its three lines restate the lead of the
 * experience at Surbana Jurong).
 */
export function buildApproach(resume) {
  return [
    heading('How I work'),
    ...resume.principles.map(
      (principle) =>
        new Paragraph({
          keepLines: true,
          children: [strong(`${principle.title}.`), new TextRun(` ${principle.body}`)],
        }),
    ),
  ];
}

/** "English · Working level. Reads and writes ...": a language as its row writes it, the level then the site's words. */
export const languageText = (language) =>
  `${language.name}${SEPARATOR}${language.level}${language.detail ? `. ${language.detail}` : ''}`;

/**
 * Education and the languages in one section, in the same label column as the skills. Vietnamese native, English
 * working level, in the words of the content file.
 */
export function buildEducationAndLanguages(resume) {
  const { school, detail, start, end } = resume.education;
  return [
    heading('Education and languages'),
    ...keepTogether([
      row(STYLE.row, 'Education', [new TextRun(`${school}, ${detail} (${start}–${end})`)]),
      ...resume.languages.map((language, i) =>
        row(STYLE.row, i === 0 ? 'Languages' : '', [new TextRun(languageText(language))]),
      ),
    ]),
  ];
}

/** All the blocks, in order. */
export function buildBody(resume) {
  return [
    ...buildFigures(resume),
    ...buildSummary(resume),
    ...buildSkills(resume),
    ...buildExperience(resume),
    ...buildPublicWork(resume),
    ...buildApproach(resume),
    ...buildEducationAndLanguages(resume),
  ];
}
