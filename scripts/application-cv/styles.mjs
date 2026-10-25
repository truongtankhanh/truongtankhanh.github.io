// The Word style sheet of the application edition (V1-20.1): page, colours, type and named styles, taken from frame 05.
// It is plain data in the shape the `docx` package takes, so this file imports nothing and holds no secret; the
// generator (V1-21.2) spreads `createStyles()` into `new Document({ ... })` and sets `PAGE` on each section.
//
// Everything a paragraph or a run looks like is defined here as a named style and nowhere else. A document built from
// it has no direct colour or size, which is what lets an applicant tracking system read the outline and lets a change
// here restyle the whole file. Sizes are in half-points, spacing and indents in twips (1/20 pt), as Word stores them.

/** The palette of V1-20.1, as `RRGGBB`. Nothing else is used: no black, no `auto`. */
export const COLORS = {
  ink: '0B1B33',
  muted: '4A5B73',
  accent: '1B4F9C',
  /** Rules only, never text. */
  steel: 'A9B8CD',
  /** The short mark before the location line only, never text. */
  gold: 'B8862B',
};

/**
 * Be Vietnam Pro is the site's font; it goes in the file only if it can be embedded (Q14), otherwise the same sizes are
 * set in Calibri, which every recruiter's Word has. `createStyles` takes either.
 */
export const FONT = { preferred: 'Be Vietnam Pro', fallback: 'Calibri' };

const mm = (millimetres) => Math.round((millimetres * 1440) / 25.4);

/**
 * A4, margins 15 mm at the sides and 14 mm at the top and bottom; the header and the footer start 11 mm from the edge,
 * so nothing sits closer than that (as in V1-13.1).
 */
export const PAGE = {
  size: { width: mm(210), height: mm(297) },
  margin: { top: mm(14), bottom: mm(14), left: mm(15), right: mm(15), header: mm(11), footer: mm(11) },
};

/** Width of the text column; the right tab stop of the Title and Heading 2 styles sits on its edge. */
export const TEXT_WIDTH = PAGE.size.width - PAGE.margin.left - PAGE.margin.right;

/** Font sizes in half-points: 26 pt, 12 pt, 11 pt, 10 pt, 9.5 pt, 8.5 pt and, in the footer, 8 pt. */
export const SIZE = { name: 52, role: 24, title: 22, section: 20, body: 19, label: 17, footer: 16 };

const SPACING = {
  /** 1.15 lines (240 is one line). */
  line: 276,
  /** 3 pt after a paragraph. */
  after: 60,
  /** 10 pt before a section title. */
  beforeSection: 200,
  /** 6 pt before a role or a project title, so one block is set off from the one above it. */
  beforeTitle: 120,
};

/** 0.12 em of 10 pt, in twips, for the section titles. */
const TRACKING = 24;

/** The bullet list of V1-20.1: a real numbering definition, so the bullet is never a typed character. */
export const BULLETS = 'cv-bullets';

/** Ids of the named styles; the generator refers to them by these and a test checks that there are no others. */
export const STYLE = {
  title: 'Title',
  subtitle: 'Subtitle',
  heading1: 'Heading1',
  heading2: 'Heading2',
  normal: 'Normal',
  bullet: 'ListBullet',
  date: 'Date',
  caption: 'Caption',
  contact: 'Contact',
  footer: 'Footer',
  strong: 'Strong',
  hyperlink: 'Hyperlink',
  figure: 'Figure',
  mark: 'Mark',
  dateRun: 'DateRun',
};

/**
 * The styles and the numbering definition for `new Document({ ...createStyles({ font }) })`.
 * `font` is `FONT.preferred` or `FONT.fallback`; the fallback is the default because it needs nothing embedded.
 */
export function createStyles({ font = FONT.fallback } = {}) {
  const face = { ascii: font, hAnsi: font, cs: font, eastAsia: font };
  const base = { font: face, color: COLORS.ink, size: SIZE.body };
  const rightTab = [{ type: 'right', position: TEXT_WIDTH }];

  // The package adds Heading 3 to 6 with its own blues. The CV does not use them; they are set to the palette so that
  // no colour outside it is in the file, even in the style gallery.
  const unusedHeadings = Object.fromEntries(
    [3, 4, 5, 6].map((level) => [
      `heading${level}`,
      { run: { ...base, bold: true }, paragraph: { keepNext: true, outlineLevel: level - 1 } },
    ]),
  );

  const styles = {
    // Document defaults: English (US), so spell check is right everywhere except where a run says `vi`.
    default: {
      document: {
        run: { ...base, language: { value: 'en-US' } },
        paragraph: { spacing: { line: SPACING.line, lineRule: 'auto', before: 0, after: SPACING.after } },
      },
      ...unusedHeadings,
    },
    paragraphStyles: [
      {
        id: STYLE.normal,
        name: 'Normal',
        quickFormat: true,
        run: base,
        paragraph: { spacing: { line: SPACING.line, lineRule: 'auto', before: 0, after: SPACING.after } },
      },
      {
        // The name. The right tab stop is where the logo sits (V1-20.2).
        id: STYLE.title,
        name: 'Title',
        basedOn: STYLE.normal,
        next: STYLE.subtitle,
        quickFormat: true,
        run: { ...base, size: SIZE.name, bold: true },
        paragraph: { keepNext: true, spacing: { before: 0, after: 0 }, tabStops: rightTab },
      },
      {
        // The role, "Full-stack Engineer". Bold is the nearest Word has to the site's semibold.
        id: STYLE.subtitle,
        name: 'Subtitle',
        basedOn: STYLE.normal,
        next: STYLE.normal,
        quickFormat: true,
        run: { ...base, size: SIZE.role, bold: true, color: COLORS.accent },
        paragraph: { keepNext: true, spacing: { before: 0, after: SPACING.after } },
      },
      {
        // A section title: capitals (shown, not typed, so a parser still reads the words), tracked, with a steel rule.
        id: STYLE.heading1,
        name: 'heading 1',
        basedOn: STYLE.normal,
        next: STYLE.normal,
        quickFormat: true,
        run: {
          ...base,
          size: SIZE.section,
          bold: true,
          allCaps: true,
          color: COLORS.accent,
          characterSpacing: TRACKING,
        },
        paragraph: {
          keepNext: true,
          keepLines: true,
          outlineLevel: 0,
          spacing: { before: SPACING.beforeSection, after: SPACING.after },
          border: { bottom: { style: 'single', size: 6, space: 2, color: COLORS.steel } },
        },
      },
      {
        // A role or a project title; the right tab stop is for its dates.
        id: STYLE.heading2,
        name: 'heading 2',
        basedOn: STYLE.normal,
        next: STYLE.normal,
        quickFormat: true,
        run: { ...base, size: SIZE.title, bold: true },
        paragraph: {
          keepNext: true,
          keepLines: true,
          outlineLevel: 1,
          spacing: { before: SPACING.beforeTitle, after: 0 },
          tabStops: rightTab,
        },
      },
      {
        id: STYLE.bullet,
        name: 'List Bullet',
        basedOn: STYLE.normal,
        quickFormat: true,
        paragraph: { numbering: { reference: BULLETS, level: 0 } },
      },
      {
        // A date or a duration on a line of its own.
        id: STYLE.date,
        name: 'Date',
        basedOn: STYLE.normal,
        next: STYLE.normal,
        quickFormat: true,
        run: { ...base, size: SIZE.label, color: COLORS.muted },
      },
      {
        id: STYLE.caption,
        name: 'caption',
        basedOn: STYLE.normal,
        next: STYLE.normal,
        quickFormat: true,
        run: { ...base, size: SIZE.label, color: COLORS.muted },
        paragraph: { keepLines: true },
      },
      {
        // The contact line under the name (V1-20.2). Its bottom border is the solid 1.5 pt accent rule that closes the
        // first-page block, in place of the silver-to-blue one of frame 05.
        id: STYLE.contact,
        name: 'Contact',
        basedOn: STYLE.normal,
        next: STYLE.normal,
        paragraph: {
          keepLines: true,
          spacing: { before: SPACING.after, after: 0 },
          border: { bottom: { style: 'single', size: 12, space: 8, color: COLORS.accent } },
        },
      },
      {
        // The footer of every page: a steel rule, the name and role at the left, "page X of Y" at the right.
        id: STYLE.footer,
        name: 'footer',
        basedOn: STYLE.normal,
        quickFormat: true,
        run: { ...base, size: SIZE.footer, color: COLORS.muted },
        paragraph: {
          spacing: { before: 0, after: 0 },
          tabStops: rightTab,
          border: { top: { style: 'single', size: 6, space: 4, color: COLORS.steel } },
        },
      },
    ],
    // Run styles for what a paragraph style cannot say: bold key phrases, links, the figures line, the mark, and a
    // date inside a Heading 2 line.
    characterStyles: [
      {
        id: STYLE.strong,
        name: 'Strong',
        basedOn: 'DefaultParagraphFont',
        quickFormat: true,
        run: { bold: true },
      },
      {
        id: STYLE.hyperlink,
        name: 'Hyperlink',
        basedOn: 'DefaultParagraphFont',
        run: { color: COLORS.accent },
      },
      {
        id: STYLE.figure,
        name: 'Figure',
        basedOn: 'DefaultParagraphFont',
        run: { bold: true, color: COLORS.accent },
      },
      { id: STYLE.mark, name: 'Mark', basedOn: 'DefaultParagraphFont', run: { color: COLORS.gold } },
      {
        id: STYLE.dateRun,
        name: 'Date Run',
        basedOn: 'DefaultParagraphFont',
        run: { bold: false, size: SIZE.label, color: COLORS.muted },
      },
    ],
  };

  const numbering = {
    config: [
      {
        reference: BULLETS,
        levels: [
          {
            level: 0,
            format: 'bullet',
            text: '•',
            alignment: 'left',
            style: {
              paragraph: { indent: { left: mm(4.5), hanging: mm(3.5) } },
              run: { font: face, color: COLORS.accent },
            },
          },
        ],
      },
    ],
  };

  return { styles, numbering };
}
