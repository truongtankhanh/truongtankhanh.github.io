// What a PDF of the application edition has to be (V1-22.1), as checks on what the poppler tools print about it. The
// functions take that output as text, so they run without the tools; `to-pdf.mjs` runs the tools. A message names the
// rule and says what is wrong, and never repeats the phone number.
import { looksLikePhone } from './private.mjs';

/** The limits of the task, in bytes: 300 KB for the CV and 400 KB for the portfolio. */
export const MAX_BYTES = { cv: 300 * 1024, portfolio: 400 * 1024 };

/** How long each file is meant to be (V1-20.3: two or three pages; V1-21.3: three to four), as the first and the last. */
export const PAGE_RANGE = { cv: [2, 3], portfolio: [3, 4] };

/** A4 in points, portrait. */
const A4 = { width: 595.276, height: 841.89 };
const TOLERANCE = 2;

/** `Pages: 3` of `pdfinfo`. */
export const parsePageCount = (pdfinfo) => {
  const count = /^Pages:\s+(\d+)/m.exec(pdfinfo)?.[1];
  return count === undefined ? undefined : Number(count);
};

/** The size of each page from `pdfinfo -f 1 -l N`, or the one line `Page size:` of an older `pdfinfo`. */
export function parsePageSizes(pdfinfo) {
  const each = [...pdfinfo.matchAll(/^Page\s+\d+\s+size:\s+([\d.]+) x ([\d.]+) pts/gm)];
  const sizes = each.length > 0 ? each : [...pdfinfo.matchAll(/^Page size:\s+([\d.]+) x ([\d.]+) pts/gm)];
  return sizes.map((m) => ({ width: Number(m[1]), height: Number(m[2]) }));
}

const isA4 = ({ width, height }) =>
  Math.abs(width - A4.width) <= TOLERANCE && Math.abs(height - A4.height) <= TOLERANCE;

/** The table of `pdffonts`: each font with its name (without the six letters of a subset) and whether it is embedded. */
export function parseFonts(pdffonts) {
  const lines = pdffonts.split('\n');
  const start = lines.findIndex((line) => /^-+\s+-+/.test(line));
  if (start < 0) return [];
  return lines
    .slice(start + 1)
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const row = /^(\S+)\s+.*?\s+(yes|no)\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/.exec(line);
      return {
        name: (row?.[1] ?? line.trim().split(/\s+/)[0]).replace(/^[A-Z]{6}\+/, ''),
        embedded: row?.[2] === 'yes',
      };
    });
}

/** Text as it is compared: compatibility forms folded (the ligature "fi"), one space, lower case (the headings are capitals). */
const norm = (text) => text.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

/** The start of a paragraph, as it is looked for in the PDF text: without a leading mark, and no longer than a line. */
const anchor = (text) =>
  norm(text)
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .slice(0, 30);

/**
 * The paragraphs of the DOCX that are not found in the text of the PDF in the order they were written in. A paragraph is
 * looked for after the one before it; a table cell is not looked for, because a PDF sets the cells in an order of its own,
 * and neither is the contact line.
 */
export function outOfOrder(paragraphs, pdfText) {
  const text = norm(pdfText);
  const lost = [];
  let at = 0;
  for (const paragraph of paragraphs) {
    // A table cell is left out (see above); so is the contact line, which holds the phone number: the rule of the phone
    // number looks at it, and what is said here must never show it.
    if (paragraph.inTable || paragraph.style === 'Contact' || looksLikePhone(paragraph.text)) continue;
    const start = anchor(paragraph.text);
    if (start.length < 3) continue;
    const found = text.indexOf(start, at);
    if (found < 0) lost.push(start);
    else at = found + start.length;
  }
  return lost;
}

/**
 * Runs the rules on one PDF.
 *
 * @param {object} input
 * @param {'cv' | 'portfolio'} input.kind
 * @param {number} input.bytes The size of the file.
 * @param {string} input.pdfinfo, input.pdffonts, input.text What `pdfinfo -f 1 -l 99`, `pdffonts` and `pdftotext` print.
 * @param {{ paragraphs: { style: string, text: string, inTable: boolean }[] }} input.docx The Word file the PDF was made from (`readDocx`).
 * @param {string} input.phone The number of `cv/private.json`.
 * @returns {{ problems: { rule: string, message: string }[], pages: number | undefined, fonts: string[], substituted: boolean }}
 */
export function checkPdf({ kind, bytes, pdfinfo, pdffonts, text, docx, phone }) {
  const problems = [];
  const fail = (rule, message) => problems.push({ rule, message });

  const limit = MAX_BYTES[kind];
  if (bytes > limit)
    fail('size', `the file is ${Math.round(bytes / 1024)} KB; the limit is ${limit / 1024} KB`);

  const pages = parsePageCount(pdfinfo);
  const [fewest, most] = PAGE_RANGE[kind];
  if (pages === undefined) fail('pages', 'pdfinfo did not say how many pages there are');
  else if (pages < fewest || pages > most) {
    fail(
      'pages',
      `${pages} page(s); a ${kind === 'cv' ? 'CV' : 'portfolio'} should have ${fewest} to ${most}`,
    );
  }

  const sizes = parsePageSizes(pdfinfo);
  const notA4 = sizes.filter((size) => !isA4(size));
  if (sizes.length === 0) fail('a4', 'pdfinfo did not say what size the pages are');
  else if (notA4.length > 0) {
    fail('a4', `${notA4.length} page(s) are not A4 (the first is ${notA4[0].width} x ${notA4[0].height} pt)`);
  }

  const fonts = parseFonts(pdffonts);
  const loose = fonts.filter((font) => !font.embedded).map((font) => font.name);
  if (fonts.length === 0) fail('fonts', 'pdffonts lists no font, so the text is not text');
  else if (loose.length > 0) fail('fonts', `fonts that are not embedded: ${[...new Set(loose)].join(', ')}`);

  if (norm(text).length < 200) fail('text', 'the PDF has little or no text that can be selected');

  const lost = outOfOrder(docx.paragraphs, text);
  if (lost.length > 0) {
    const shown = lost
      .slice(0, 3)
      .map((start) => (looksLikePhone(start) ? '"(a line with a phone-like text)"' : `"${start}"`))
      .join(', ');
    fail(
      'order',
      `${lost.length} paragraph(s) of the Word file are not in the text of the PDF in the same order, from ${shown}`,
    );
  }

  const digits = phone.replace(/\D/g, '');
  const lines = text.split('\n');
  const written =
    lines
      .map((line) => line.replace(/\D/g, ''))
      .join('|')
      .split(digits).length - 1;
  const phoneLike = lines.filter((line) => looksLikePhone(line)).length;
  if (written !== 1)
    fail(
      'phone',
      `the phone number of cv/private.json is written ${written} times in the text of the PDF; it should be once`,
    );
  if (phoneLike !== 1)
    fail(
      'phone',
      `${phoneLike} lines of the text of the PDF look like a phone number; it should be one, the contact line`,
    );

  const names = [...new Set(fonts.map((font) => font.name))];
  return {
    problems,
    pages,
    fonts: names,
    substituted: names.length > 0 && !names.some((name) => /calibri|carlito/i.test(name)),
  };
}
