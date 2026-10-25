// The body of the application CV (V1-20.3), one function per block, as `docx` paragraphs in the named styles of
// `styles.mjs`. It is one column in the reading order of the Word edition: career figures, Summary, Technical Skills,
// Experience, Public work, How I work, Education, Languages. No table, no text box and no picture, so an applicant
// tracking system reads it as plain text in order.
//
// `resume` is the content of `src/content/resume.ts` as a plain object, and every word comes from it; this module adds
// only the headings and the labels. It holds no phone number and no secret.
import { ExternalHyperlink, Paragraph, Tab, TextRun } from 'docx';
import { STYLE } from './styles.mjs';
import { displayUrl, emphasis, formatRange } from './text.mjs';

const SEPARATOR = ' · ';

export const strong = (text) => new TextRun({ text, style: STYLE.strong });
const figure = (text) => new TextRun({ text, style: STYLE.figure });
const link = (text, href) =>
  new ExternalHyperlink({ link: href, children: [new TextRun({ text, style: STYLE.hyperlink })] });

/** The runs of a text whose `**key phrases**` are bold. */
export const rich = (text) =>
  emphasis(text).map((part) => (part.strong ? strong(part.text) : new TextRun(part.text)));

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

/** "7+ years shipping production software · 5+ marketplaces integrated · ...": each value in bold accent. */
function figuresLine(figures) {
  return new Paragraph({
    keepLines: true,
    children: joined(figures.map((f) => [figure(f.value), new TextRun(` ${f.label}`)])),
  });
}

/** The career figures as one line of text. */
export function buildFigures(resume) {
  return [figuresLine(resume.metrics)];
}

export function buildSummary(resume) {
  return [
    heading('Summary'),
    ...resume.intro.map((text) => new Paragraph({ children: [new TextRun(text)] })),
  ];
}

/** One `Label: item, item` line per group of the site, with the label in bold. */
export function buildSkills(resume) {
  return [
    heading('Technical Skills'),
    ...resume.skills.map(
      (group) =>
        new Paragraph({
          keepLines: true,
          children: [strong(`${group.name}:`), new TextRun(` ${group.items.join(', ')}`)],
        }),
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

/** Every repository leads with one figure: its own, or else the one its case study leads with. */
export function buildPublicWork(resume) {
  return [
    heading('Public work'),
    ...resume.projects.map((project) => {
      const lead = project.stat ?? project.caseStudy?.does.lead.figure;
      return new Paragraph({
        keepLines: true,
        children: joined([
          [strong(project.name)],
          ...(lead ? [[figure(lead.value), new TextRun(` – ${lead.label}`)]] : []),
          [link(displayUrl(project.repo), project.repo)],
        ]),
      });
    }),
  ];
}

/** The scope figures, what I own, and the principles, each with its first line of evidence. */
export function buildApproach(resume) {
  const { leadership, principles } = resume;
  return [
    heading('How I work'),
    figuresLine(leadership.figures),
    new Paragraph({ keepNext: true, keepLines: true, children: [strong('What I own')] }),
    ...leadership.owns.map((own) => new Paragraph({ ...bullet(own), keepLines: true })),
    ...principles.flatMap((principle) => {
      const [evidence] = principle.evidence;
      return keepTogether([
        { children: [strong(`${principle.title}.`), new TextRun(` ${principle.body}`)] },
        ...(evidence
          ? [
              {
                style: STYLE.caption,
                children: [new TextRun(`In practice: ${evidence.text} (${evidence.source})`)],
              },
            ]
          : []),
      ]);
    }),
  ];
}

export function buildEducation(resume) {
  const { school, detail, start, end } = resume.education;
  return [
    heading('Education'),
    ...keepTogether([
      { children: [strong(school)] },
      { style: STYLE.caption, children: [new TextRun(`${detail} (${start}–${end})`)] },
    ]),
  ];
}

/** Vietnamese native, English working level, in the words of the content file. */
export function buildLanguages(resume) {
  return [
    heading('Languages'),
    ...resume.languages.flatMap((language) =>
      keepTogether([
        { children: [strong(language.name), new TextRun(`${SEPARATOR}${language.level}`)] },
        ...(language.detail ? [{ style: STYLE.caption, children: [new TextRun(language.detail)] }] : []),
      ]),
    ),
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
    ...buildEducation(resume),
    ...buildLanguages(resume),
  ];
}
