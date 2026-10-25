// The first-page block and the footer of the application edition (V1-20.2), as `docx` paragraphs. Each block is a
// plain paragraph in the named styles of `styles.mjs`; there is no table, no text box and no floating picture, so the
// text reads in the order it is written: location, name, role, contact line.
//
// `resume` is the content of `src/content/resume.ts` as a plain object. The phone number is an argument: it comes from
// `cv/private.json` (V1-21.1) and is written once, in the contact line, and nowhere else.
import { ExternalHyperlink, Footer, ImageRun, PageNumber, Paragraph, Tab, TextRun } from 'docx';
import { STYLE } from './styles.mjs';

/**
 * The monogram of `docs/design/v1/brand/logo-mark-on-light.svg`, rendered once with headless Chrome at 330 x 330 px on a
 * transparent background (about 600 dpi at 14 mm).
 */
export const LOGO_FILE = new URL('./assets/logo-mark-on-light.png', import.meta.url);

/** 14 mm at 96 dpi, the unit `docx` sizes a picture in. */
const LOGO_SIZE = 53;

/** Vietnamese, so spell check leaves the diacritics of the name alone in an English document. */
const VIETNAMESE = { value: 'vi-VN' };

const SEPARATOR = ' · ';

/** A link as people read it, the rule of `displayUrl` in `src/lib/urls.ts`. */
const display = (href) =>
  href
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');

const link = (text, href) =>
  new ExternalHyperlink({ link: href, children: [new TextRun({ text, style: STYLE.hyperlink })] });

/** The phone as a `tel:` link when it is a number; the dry run's "(phone on request)" stays plain text. */
function phoneRun(phone) {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.replace(/\D/g, '').length >= 7 ? link(phone, `tel:${digits}`) : new TextRun(phone);
}

/** Phone, email, site, GitHub and LinkedIn, separated by a middle dot. */
function contactRuns(resume, phone) {
  const links = [
    [resume.email, `mailto:${resume.email}`],
    [display(resume.siteUrl), resume.siteUrl],
    [display(resume.links.github), resume.links.github],
    [display(resume.links.linkedin), resume.links.linkedin],
  ].map(([text, href]) => link(text, href));
  return [phoneRun(phone), ...links].flatMap((run, i) => (i === 0 ? [run] : [new TextRun(SEPARATOR), run]));
}

/**
 * The four paragraphs that open the CV: a muted location line with the gold mark, the name with the monogram at the
 * right through a tab stop, the role, and the contact line over the accent rule.
 *
 * @param {{ resume: object, phone: string, logo: Buffer }} input `logo` is the content of `LOGO_FILE`.
 */
export function buildFirstBlock({ resume, phone, logo }) {
  if (typeof phone !== 'string' || phone.trim() === '')
    throw new Error('The contact line needs a phone number');
  const monogram = `${resume.nameAscii} monogram`;

  return [
    new Paragraph({
      style: STYLE.caption,
      keepNext: true,
      children: [
        new TextRun({ text: '—', style: STYLE.mark }),
        new TextRun(` ${resume.location}${SEPARATOR}${resume.timezone}`),
      ],
    }),
    new Paragraph({
      style: STYLE.title,
      children: [
        new TextRun({ text: resume.name, language: VIETNAMESE }),
        new TextRun({ children: [new Tab()] }),
        new ImageRun({
          type: 'png',
          data: logo,
          transformation: { width: LOGO_SIZE, height: LOGO_SIZE },
          altText: { name: 'Monogram', title: monogram, description: monogram },
        }),
      ],
    }),
    new Paragraph({ style: STYLE.subtitle, children: [new TextRun(resume.headline)] }),
    new Paragraph({ style: STYLE.contact, children: contactRuns(resume, phone) }),
  ];
}

/**
 * The footer of every page: the name and role at the left and "page X of Y" at the right, over a steel rule (the rule is
 * in the Footer style). The phone number is not repeated here.
 */
export function buildFooter({ resume }) {
  return new Footer({
    children: [
      new Paragraph({
        style: STYLE.footer,
        children: [
          new TextRun({ text: resume.name, language: VIETNAMESE }),
          new TextRun(`${SEPARATOR}${resume.headline}`),
          new TextRun({ children: [new Tab()] }),
          new TextRun({ children: ['page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES] }),
        ],
      }),
    ],
  });
}
