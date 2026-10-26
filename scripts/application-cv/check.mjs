// The parity check of the application edition (V1-21.4): do the CV and the portfolio tell the story of the site, and
// does the phone number sit where it should and nowhere else? It reads the generated .docx files, not the code that
// made them, so it also catches a file that is out of date: a role removed from `resume.ts`, a changed title.
//
// This module only checks and reports; `scripts/check-application-cv.mjs` finds the files. A message names the rule
// that failed and the file, and never repeats the phone number.
import { createRequire } from 'node:module';
import { PORTFOLIO_SUBTITLE } from './portfolio.mjs';
import { looksLikePhone } from './private.mjs';
import { formatRange } from './text.mjs';

// `jszip` is a dependency of `docx`, not of this repository, so pnpm does not let the repository import it by name.
// It is found the way `docx` finds it, which adds nothing to `package.json`.
const here = createRequire(import.meta.url);
const JSZip = createRequire(here.resolve('docx'))('jszip');

const decode = (text) =>
  text
    .replace(/&#x([\da-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

/** The text of some WordprocessingML: its `<w:t>` runs, with a tab where there is a `<w:tab/>`. */
const textOf = (xml) =>
  decode([...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>|<w:tab\/>/g)].map((m) => m[1] ?? '\t').join(''));

/**
 * Opens a .docx and gives what the rules read: each paragraph with its style, the rows of each table, the text of the
 * footer, the relationships (where the links go) and the properties of the file.
 *
 * @param {Buffer} buffer
 * @param {string} name The file name, for the messages.
 */
export async function readDocx(buffer, name) {
  const zip = await JSZip.loadAsync(buffer);
  const read = async (part, optional = false) => {
    const file = zip.file(part);
    if (file) return file.async('string');
    if (optional) return '';
    throw new Error(`${name} has no ${part}; it is not a Word file`);
  };
  const body = await read('word/document.xml');
  return {
    name,
    paragraphs: [...body.matchAll(/<w:p[ >].*?<\/w:p>/gs)].map((p) => ({
      style: /<w:pStyle w:val="([^"]+)"/.exec(p[0])?.[1] ?? 'Normal',
      text: textOf(p[0]),
    })),
    tables: [...body.matchAll(/<w:tbl>.*?<\/w:tbl>/gs)].map((table) =>
      [...table[0].matchAll(/<w:tr[ >].*?<\/w:tr>/gs)].map((row) =>
        [...row[0].matchAll(/<w:tc>.*?<\/w:tc>/gs)].map((cell) => textOf(cell[0])),
      ),
    ),
    footer: textOf(await read('word/footer1.xml', true)),
    rels: await read('word/_rels/document.xml.rels'),
    core: await read('docProps/core.xml'),
  };
}

const lower = (text) => text.toLowerCase();
const texts = (doc, style) => doc.paragraphs.filter((p) => p.style === style).map((p) => p.text);
/** Everything the reader sees: the paragraphs (the cells of a table are paragraphs too) and the footer. */
const everything = (doc) => [...doc.paragraphs.map((p) => p.text), doc.footer];

/** The difference between two lists of texts, compared without case: what the first has and the second lacks, and the reverse. */
function difference(expected, actual) {
  const a = actual.map(lower);
  const e = expected.map(lower);
  return {
    missing: expected.filter((text) => !a.includes(lower(text))),
    extra: actual.filter((text) => !e.includes(lower(text))),
    // The same texts in another order is a difference too: the experience is newest first.
    reordered:
      expected.length === actual.length &&
      e.every((text) => a.includes(text)) &&
      e.some((text, i) => text !== a[i]),
  };
}

/** `missing: "a", "b"; not in <source> any more: "c"`, or an empty string when the lists agree. */
function describe({ missing, extra, reordered }, source = 'the site') {
  const quote = (list) => list.map((text) => `"${text.replace(/\t/g, ' ')}"`).join(', ');
  return [
    missing.length > 0 && `missing: ${quote(missing)}`,
    extra.length > 0 && `not in ${source} any more: ${quote(extra)}`,
    reordered && `in another order than ${source}`,
  ]
    .filter(Boolean)
    .join('; ');
}

/** The roles of the site as the CV writes them: the company, a tab, the dates; newest first. */
const roleLines = (resume) =>
  [...resume.experience]
    .sort((a, b) => b.start.localeCompare(a.start))
    .map((role) => `${role.company}\t${formatRange(role.start, role.end)}`);

const OLD_TITLE = /Project Lead \/ Senior/i;
const OLD_ENGLISH = /actively improving/i;
const PLACEHOLDER = /\bTODO\b|\bFIXME\b|undefined|\[object |\bNaN\b|\{\{|\}\}/;

/** One rule's problems, or none: each is a text. */
const rules = {
  /** The role line under the name is the title of the site, as it is. */
  title: (doc, { resume }) => {
    const [subtitle] = texts(doc, 'Subtitle');
    return subtitle === resume.headline
      ? []
      : [`the role line is "${subtitle}" and the site says "${resume.headline}"`];
  },

  /** The roles, their titles and their dates are those of the site, newest first, no more and no fewer. */
  experience: (doc, { resume }) => {
    const roles = describe(difference(roleLines(resume), texts(doc, 'Heading2')));
    const titles = describe(
      difference(
        [...resume.experience].sort((a, b) => b.start.localeCompare(a.start)).map((role) => role.title),
        texts(doc, 'RoleTitle'),
      ),
    );
    return [roles && `roles and dates ${roles}`, titles && `role titles ${titles}`].filter(Boolean);
  },

  /** The career figures are one line, with every value as the site writes it (`+`, `~`, `/s`). */
  figures: (doc, { resume }) => {
    const line = resume.metrics.map((m) => `${m.value} ${m.label}`).join(' · ');
    return doc.paragraphs.some((p) => p.text === line)
      ? []
      : [`the line of career figures is missing or changed; it should read "${line}"`];
  },

  /** The languages, with the level and the words of the site about the English. */
  english: (doc, { resume }) => {
    const wanted = resume.languages.flatMap((l) => [
      `${l.name} · ${l.level}`,
      ...(l.detail ? [l.detail] : []),
    ]);
    const problems = describe({
      ...difference(
        wanted,
        doc.paragraphs.map((p) => p.text),
      ),
      extra: [],
      reordered: false,
    });
    return problems ? [`the languages ${problems}`] : [];
  },

  /** The email is in the contact line. */
  email: (doc, { resume }) =>
    texts(doc, 'Contact').some((text) => text.includes(resume.email))
      ? []
      : [`the contact line does not hold the email of the site`],

  /** The old wording of the masters is gone. */
  'old-wording': (doc) =>
    everything(doc)
      .flatMap((text) => [
        OLD_TITLE.test(text) && 'the old title "Project Lead / Senior ..." is in the file',
        OLD_ENGLISH.test(text) && 'the old English level "actively improving ..." is in the file',
      ])
      .filter(Boolean),

  /** No placeholder was left in the text. */
  placeholders: (doc) =>
    everything(doc)
      .filter((text) => PLACEHOLDER.test(text))
      .map((text) => `a placeholder is in the text: "${PLACEHOLDER.exec(text)[0]}"`),

  /**
   * The phone number is in the contact line once and nowhere else (not in a bullet, not in the footer, not in the
   * properties). In a dry run it is nowhere, and no link is a `tel:`.
   */
  phone: (doc, { phone, dryRun }) => {
    const hits = doc.paragraphs.filter((p) => looksLikePhone(p.text));
    const links = doc.rels.match(/Target="tel:/g)?.length ?? 0;
    const problems = [];
    if (looksLikePhone(doc.footer)) problems.push('a phone number is in the footer');
    if (looksLikePhone(doc.core)) problems.push('a phone number is in the properties of the file');
    if (dryRun) {
      if (hits.length > 0)
        problems.push(`the dry run has a phone number in ${hits.length} paragraph(s), and should have none`);
      if (links > 0) problems.push('the dry run has a tel: link, and should have none');
      return problems;
    }
    if (hits.length !== 1) {
      problems.push(
        `the phone number is in ${hits.length} paragraphs; it should be in one, the contact line`,
      );
    } else if (hits[0].style !== 'Contact') {
      problems.push(`the phone number is in a ${hits[0].style} paragraph, not in the contact line`);
    }
    const digits = phone.replace(/\D/g, '');
    const count =
      doc.paragraphs
        .map((p) => p.text.replace(/\D/g, ''))
        .join('|')
        .split(digits).length - 1;
    if (count !== 1)
      problems.push(`the phone number of cv/private.json is written ${count} times; it should be once`);
    if (links > 1) problems.push(`there are ${links} tel: links; there should be at most one`);
    return problems;
  },
};

/** What the portfolio is compared with, for the messages. */
const PRIVATE_FILE_NAME = 'cv/private.json';

/** The rules that are about the CV alone: its role line, its roles, its figures and its languages. */
const CV_ONLY = new Set(['title', 'experience', 'figures', 'english']);

/** The rules that only the portfolio has. */
const portfolioRules = {
  /** The table and the blocks are the projects of the private file, in the order the file gives them. */
  'portfolio-projects': (doc, { projects }) => {
    const problems = [];
    const [header, ...rows] = doc.tables[0] ?? [];
    if (JSON.stringify(header) !== JSON.stringify(['Project', 'Company', 'Duration', 'Role'])) {
      problems.push('the overview table has no header row of Project, Company, Duration and Role');
    }
    const table = describe(
      difference(
        projects.map((p) => [p.name, p.company, p.duration, p.tableRole].join('\t')),
        rows.map((r) => r.join('\t')),
      ),
      PRIVATE_FILE_NAME,
    );
    if (table) problems.push(`the overview table ${table}`);
    const companies = [...new Set(projects.map((p) => p.company))];
    const blocks = companies.flatMap((company) =>
      projects.filter((p) => p.company === company).map((p) => `${p.title ?? p.name}\t${p.duration}`),
    );
    const heads = describe(difference(blocks, texts(doc, 'Heading2')), PRIVATE_FILE_NAME);
    if (heads) problems.push(`the project blocks ${heads}`);
    const groups = describe(
      difference(['Project overview', ...companies], texts(doc, 'Heading1')),
      PRIVATE_FILE_NAME,
    );
    if (groups) problems.push(`the companies ${groups}`);
    return problems;
  },

  /** A company of the site is headed with the title and the dates of its role on the site. */
  'portfolio-roles': (doc, { resume, projects }) => {
    const wanted = [...new Set(projects.map((p) => p.company))].flatMap((company) => {
      const role = resume.experience.find((r) => r.company === company);
      return role ? [`${role.title} · ${formatRange(role.start, role.end)}`] : [];
    });
    const problems = describe(difference(wanted, texts(doc, 'RoleTitle')));
    return problems ? [`the roles under the companies ${problems}`] : [];
  },

  /** The portfolio says what it is. */
  'portfolio-subtitle': (doc) => {
    const [subtitle] = texts(doc, 'Subtitle');
    return subtitle === PORTFOLIO_SUBTITLE
      ? []
      : [`the line under the name is "${subtitle}", not "${PORTFOLIO_SUBTITLE}"`];
  },
};

/** The strings of the public content, lower case, to tell what the site says from what only this edition says. */
function publicText(value, out = []) {
  if (typeof value === 'string') out.push(lower(value));
  else if (Array.isArray(value)) value.forEach((item) => publicText(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => publicText(item, out));
  return out;
}

/**
 * Each fact a project marks as private-only is in the application files and is not in the public content; the ones
 * that are not are the problems.
 */
function privateOnlyProblems(portfolio, { resume, projects }) {
  const site = publicText(resume);
  const written = lower(everything(portfolio).join('\n'));
  return projects.flatMap((project) =>
    (project.privateOnly ?? [])
      .flatMap((fact) => [
        !written.includes(lower(fact)) &&
          `"${fact}" is marked private-only for "${project.name}" but is not in the portfolio`,
        site.some((text) => text.includes(lower(fact))) &&
          `"${fact}" is marked private-only for "${project.name}" but the site says it too`,
      ])
      .filter(Boolean),
  );
}

/**
 * The old appendix, if there is one to compare with: every project row of its table, and every date range of a company
 * line, must be in the new portfolio.
 */
function oldAppendixProblems(portfolio, master) {
  const rows = (master.tables[0] ?? []).slice(1).map((r) => r.join('\t'));
  const ours = (portfolio.tables[0] ?? []).slice(1).map((r) => r.join('\t'));
  const lost = describe({ ...difference(rows, ours), extra: [], reordered: false });
  const written = lower(everything(portfolio).join('\n'));
  // A company line is "Company  Title <tab> Apr 2024 – Present"; the lines of a project are "Label <tab> text".
  const ranges = master.paragraphs
    .map((p) => p.text.split('\t'))
    .filter(([left, right]) => right && !/^(Overview|Role|Team|Tech stack)$/.test(left.trim()))
    .map(([, right]) => right.trim())
    .filter((range) => /\d{4}/.test(range) && range.includes('–'));
  const gone = ranges.filter((range) => !written.includes(lower(range)));
  return [
    lost && `a project of the old appendix ${lost}`,
    gone.length > 0 &&
      `date ranges of the old appendix are not in the portfolio: ${gone.map((r) => `"${r}"`).join(', ')}`,
  ].filter(Boolean);
}

/**
 * Runs every rule on the files.
 *
 * @param {object} input
 * @param {object} input.resume The content of `src/content/resume.ts`.
 * @param {{ cv: object, portfolio?: object }} input.files Results of `readDocx`.
 * @param {string} [input.phone] The number of `cv/private.json`; none in a dry run.
 * @param {boolean} [input.dryRun]
 * @param {object[]} [input.projects] The `extraProjects` the portfolio was built from.
 * @param {object} [input.master] The old appendix, a result of `readDocx`, when there is one to compare with.
 * @param {string} [input.linkedin] The LinkedIn address of the private file, if it replaces the site's.
 * @returns {{ failures: { rule: string, file: string, message: string }[], passed: { rule: string, file: string }[], differences: string[] }}
 */
export function checkParity({ resume, files, phone, dryRun = false, projects = [], master, linkedin }) {
  const failures = [];
  const passed = [];
  const run = (doc, rule, problems) => {
    if (problems.length === 0) passed.push({ rule, file: doc.name });
    for (const message of problems) failures.push({ rule, file: doc.name, message });
  };
  const context = { resume, phone, dryRun, projects };

  for (const [name, rule] of Object.entries(rules)) {
    run(files.cv, name, rule(files.cv, context));
    if (files.portfolio && !CV_ONLY.has(name)) run(files.portfolio, name, rule(files.portfolio, context));
  }
  if (files.portfolio) {
    for (const [name, rule] of Object.entries(portfolioRules))
      run(files.portfolio, name, rule(files.portfolio, context));
    run(files.portfolio, 'private-only', privateOnlyProblems(files.portfolio, context));
    if (master) run(files.portfolio, 'old-appendix', oldAppendixProblems(files.portfolio, master));
  }

  const differences = [
    dryRun
      ? 'phone number: a dry run, so the placeholder "(phone on request)" takes its place'
      : 'phone number: in the contact line of each file (the number itself is not shown here)',
    ...(linkedin ? ['LinkedIn address: the one of cv/private.json replaces the one of resume.ts'] : []),
    ...(files.portfolio
      ? [
          `project portfolio: ${projects.length} project(s) that only the application edition has: ${projects.map((p) => p.name).join('; ')}`,
          ...projects.flatMap((p) =>
            (p.privateOnly ?? []).map((fact) => `private-only: "${fact}" (${p.name}, ${p.company})`),
          ),
        ]
      : ['project portfolio: none, because cv/private.json has no extraProjects']),
    ...(files.portfolio && !master
      ? ['old appendix: not found, so the portfolio is compared with cv/private.json only']
      : []),
  ];

  return { failures, passed, differences };
}
