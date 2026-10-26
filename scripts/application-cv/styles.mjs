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
  /** Text on the navy band of the first page: the name, and the links of the contact line. */
  white: 'FFFFFF',
  /** Text on the navy band: the location, the role and the contact line. */
  mist: 'C5D3EA',
  /** The fill of the strip of career figures under the band, never text. */
  tint: 'EEF3FA',
};

/**
 * Be Vietnam Pro is the site's font; it goes in the file only if it can be embedded (Q14), otherwise the same sizes are
 * set in Calibri, which every recruiter's Word has. `createStyles` takes either.
 */
export const FONT = { preferred: 'Be Vietnam Pro', fallback: 'Calibri' };

const mm = (millimetres) => Math.round((millimetres * 1440) / 25.4);

/**
 * A4, margins 15 mm at the sides, 12 mm at the top and 15 mm at the bottom; the footer starts 8 mm from the edge, so
 * the last line of text keeps clear of its rule. The text is 10 pt, so the margins are what keeps the CV to two pages.
 */
export const PAGE = {
  size: { width: mm(210), height: mm(297) },
  margin: { top: mm(12), bottom: mm(15), left: mm(15), right: mm(15), header: mm(10), footer: mm(8) },
};

/** Width of the text column; the right tab stop of the Title and Heading 2 styles sits on its edge. */
export const TEXT_WIDTH = PAGE.size.width - PAGE.margin.left - PAGE.margin.right;

/**
 * Font sizes in half-points: 26 pt (the name), 18 pt (the title of the portfolio part), 12 pt (the role), 11.5 pt (a
 * role or a project title), 10 pt (the text and the section titles), 9.5 pt (the figures), 9 pt (small text) and, in the
 * footer, 8.5 pt.
 */
export const SIZE = {
  name: 52,
  part: 36,
  role: 24,
  title: 23,
  section: 20,
  body: 20,
  strip: 19,
  label: 18,
  footer: 17,
};

const SPACING = {
  /** 1.12 lines (240 is one line). */
  line: 269,
  /** 2.5 pt after a paragraph. */
  after: 50,
  /** 10 pt before a section title. */
  beforeSection: 200,
  /** 8 pt before a role or a project title, so one block is set off from the one above it. */
  beforeTitle: 160,
};

/** 0.12 em of 10 pt, in twips, for the section titles. */
const TRACKING = 24;

/**
 * How far the navy band and the strip of figures reach beyond the text column on each side, in points. A paragraph's
 * shading runs out to its border, so the border's distance from the text is what makes the band wider than the text; at
 * 14 pt it still sits 28 pt inside the edge of the page.
 */
const BAND_REACH = 14;

/** The first-page block: one navy box round the location, name, role and contact lines (they share this, so Word draws one box). */
const band = {
  shading: { type: 'clear', fill: COLORS.ink, color: COLORS.ink },
  border: Object.fromEntries(
    [
      ['top', 12],
      ['bottom', 12],
      ['left', BAND_REACH],
      ['right', BAND_REACH],
    ].map(([side, space]) => [side, { style: 'single', size: 4, space, color: COLORS.ink }]),
  ),
};

/** The strip of figures under the band: the same width, in the pale tint. */
const strip = {
  shading: { type: 'clear', fill: COLORS.tint, color: COLORS.tint },
  border: Object.fromEntries(
    [
      ['top', 6],
      ['bottom', 6],
      ['left', BAND_REACH],
      ['right', BAND_REACH],
    ].map(([side, space]) => [side, { style: 'single', size: 4, space, color: COLORS.tint }]),
  ),
};

/** The label column of a `Label<tab>text` row: the text wraps under itself, not under the label. */
export const ROW_INDENT = mm(32);
export const FIELD_INDENT = mm(22);
const hanging = (left) => ({
  tabStops: [{ type: 'left', position: left }],
  indent: { left, hanging: left },
});
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
  location: 'Location',
  figureStrip: 'FigureStrip',
  part: 'Part',
  row: 'Row',
  field: 'Field',
  cell: 'TableText',
  repo: 'Repo',
  repoLink: 'RepoLink',
  roleTitle: 'RoleTitle',
  footer: 'Footer',
  strong: 'Strong',
  hyperlink: 'Hyperlink',
  bandLink: 'BandLink',
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
        // The name, white on the band. The right tab stop is where the logo sits (V1-20.2).
        id: STYLE.title,
        name: 'Title',
        basedOn: STYLE.normal,
        next: STYLE.subtitle,
        quickFormat: true,
        run: { ...base, size: SIZE.name, bold: true, color: COLORS.white },
        paragraph: { ...band, keepNext: true, spacing: { before: 0, after: 0 }, tabStops: rightTab },
      },
      {
        // The role, "Full-stack Engineer", on the band. Bold is the nearest Word has to the site's semibold.
        id: STYLE.subtitle,
        name: 'Subtitle',
        basedOn: STYLE.normal,
        next: STYLE.normal,
        quickFormat: true,
        run: { ...base, size: SIZE.role, bold: true, color: COLORS.mist },
        paragraph: { ...band, keepNext: true, spacing: { before: 0, after: SPACING.after } },
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
        // The two contact lines under the name (V1-20.2), the last paragraphs of the band: it ends under them.
        id: STYLE.contact,
        name: 'Contact',
        basedOn: STYLE.normal,
        next: STYLE.normal,
        run: { ...base, color: COLORS.mist },
        paragraph: { ...band, keepLines: true, spacing: { before: 0, after: 0 } },
      },
      {
        // The location line above the name, on the band, with the gold mark before it.
        id: STYLE.location,
        name: 'Location',
        basedOn: STYLE.normal,
        next: STYLE.title,
        run: { ...base, size: SIZE.label, color: COLORS.mist },
        paragraph: { ...band, keepNext: true, keepLines: true, spacing: { before: 0, after: SPACING.after } },
      },
      {
        // The title of the portfolio in the one-file edition: it starts a new page, so the CV and its appendix read as
        // two parts of one document, and it has the accent rule the first block used to have.
        id: STYLE.part,
        name: 'Part Title',
        basedOn: STYLE.normal,
        next: STYLE.figureStrip,
        quickFormat: true,
        run: { ...base, size: SIZE.part, bold: true },
        paragraph: {
          pageBreakBefore: true,
          keepNext: true,
          keepLines: true,
          outlineLevel: 0,
          spacing: { before: 0, after: 160 },
          border: { bottom: { style: 'single', size: 12, space: 6, color: COLORS.accent } },
        },
      },
      {
        // The career figures as one centred line on a pale strip, directly under the band.
        id: STYLE.figureStrip,
        name: 'Figure Strip',
        basedOn: STYLE.normal,
        next: STYLE.normal,
        run: { ...base, size: SIZE.strip },
        paragraph: { ...strip, alignment: 'center', keepLines: true, spacing: { before: 0, after: 0 } },
      },
      {
        // A row of the Technical Skills and of the closing section: a bold label, then the text in its own column.
        id: STYLE.row,
        name: 'Row',
        basedOn: STYLE.normal,
        quickFormat: true,
        paragraph: { ...hanging(ROW_INDENT), keepLines: true },
      },
      {
        // A public repository: its name and figure, kept tight to the address under it.
        id: STYLE.repo,
        name: 'Repo',
        basedOn: STYLE.normal,
        next: STYLE.repoLink,
        quickFormat: true,
        paragraph: { keepNext: true, keepLines: true, spacing: { before: 0, after: 0 } },
      },
      {
        // The address of a public repository, with more space after it than between the two lines of one repository.
        id: STYLE.repoLink,
        name: 'Repo Link',
        basedOn: STYLE.normal,
        next: STYLE.repo,
        quickFormat: true,
        run: { ...base, size: SIZE.label, color: COLORS.muted },
        paragraph: { keepLines: true, spacing: { before: 0, after: 100 } },
      },
      {
        // The text of a cell of the overview table of the portfolio, a half-point smaller than the body so a row is one line.
        id: STYLE.cell,
        name: 'Table Text',
        basedOn: STYLE.normal,
        quickFormat: true,
        run: { ...base, size: SIZE.strip },
        paragraph: { spacing: { before: 0, after: 0 } },
      },
      {
        // The same for the fields of a project of the portfolio (Role, Team, Stack), whose labels are shorter.
        id: STYLE.field,
        name: 'Field',
        basedOn: STYLE.normal,
        quickFormat: true,
        paragraph: { ...hanging(FIELD_INDENT), keepLines: true, spacing: { before: 0, after: 40 } },
      },
      {
        // The title of a role, under its company line (V1-20.3): body size in accent, kept with what follows.
        id: STYLE.roleTitle,
        name: 'Role Title',
        basedOn: STYLE.normal,
        next: STYLE.normal,
        run: { ...base, color: COLORS.accent },
        paragraph: { keepNext: true, keepLines: true },
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
        run: { bold: false, size: SIZE.body, color: COLORS.muted },
      },
      {
        // A link of the contact line, which is on the navy band, where the accent of a Hyperlink could not be read.
        id: STYLE.bandLink,
        name: 'Band Link',
        basedOn: 'DefaultParagraphFont',
        run: { color: COLORS.white },
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
