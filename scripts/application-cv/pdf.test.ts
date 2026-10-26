import { describe, expect, it } from 'vitest';

interface Paragraph {
  style?: string;
  text: string;
  inTable: boolean;
}
interface Problem {
  rule: string;
  message: string;
}
interface Pdf {
  MAX_BYTES: Record<'cv' | 'portfolio' | 'combined', number>;
  PAGE_RANGE: Record<'cv' | 'portfolio' | 'combined', [number, number]>;
  parsePageCount(pdfinfo: string): number | undefined;
  parsePageSizes(pdfinfo: string): { width: number; height: number }[];
  parseFonts(pdffonts: string): { name: string; embedded: boolean }[];
  outOfOrder(paragraphs: Paragraph[], pdfText: string): string[];
  checkPdf(input: {
    kind: 'cv' | 'portfolio' | 'combined';
    bytes: number;
    pdfinfo: string;
    pdffonts: string;
    text: string;
    docx: { paragraphs: Paragraph[] };
    phone: string;
  }): { problems: Problem[]; pages: number | undefined; fonts: string[]; substituted: boolean };
}

// The module is plain JavaScript; a computed specifier keeps the type checker out of it.
const path = './pdf.mjs';
const { MAX_BYTES, PAGE_RANGE, parsePageCount, parsePageSizes, parseFonts, outOfOrder, checkPdf } =
  (await import(path)) as Pdf;

// Put together here and not written out, so no number appears in this file.
const NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9].join('');
const PHONE = ['0', NINE.slice(0, 2), NINE.slice(2, 5), NINE.slice(5)].join(' ');

const para = (text: string, inTable = false): Paragraph => ({ text, inTable });
const paragraphs = [
  para('— Lâm Đồng, Vietnam · UTC+7'),
  para('Trương Tấn Khánh\t'),
  para('Full-stack Engineer'),
  { style: 'Contact', text: `${PHONE} · someone@example.com · example.github.io`, inTable: false },
  para('Summary'),
  para('I design, build and ship systems end to end: system design, NestJS and Node.js backends.'),
  para('Experience'),
  para('Surbana Jurong\tApr 2024 – Present'),
  para('Project'),
  para('Company', true),
  para('Education'),
];
/** The text a PDF of those paragraphs gives: one paragraph a line, the headings in capitals, a footer after the page. */
const textOf = (list: Paragraph[], extra = '') =>
  list
    .filter((p) => !p.inTable)
    .map((p) => {
      const line = p.text.replace(/\t/g, '          ');
      return /^(Summary|Experience|Project|Education)$/.test(line) ? line.toUpperCase() : line;
    })
    .join('\n') + `\nTrương Tấn Khánh · Full-stack Engineer          page 1 of 2\n${extra}`;
const long = ' ' + 'A sentence that makes the text long enough to be text. '.repeat(8);

const pdfinfo = (pages: number, size = '595.276 x 841.89') =>
  [
    'Title:          Truong Tan Khanh, CV',
    'Producer:       LibreOffice 26.8',
    `Pages:          ${pages}`,
    ...Array.from({ length: pages }, (_, i) => `Page ${String(i + 1).padStart(4)} size: ${size} pts (A4)`),
    'File size:      61000 bytes',
  ].join('\n');
const embeddedFonts = [
  'name                                 type              encoding         emb sub uni object ID',
  '------------------------------------ ----------------- ---------------- --- --- --- ---------',
  'ABCDEF+Calibri                       CID TrueType      Identity-H       yes yes yes     12  0',
  'GHIJKL+Calibri-Bold                  CID TrueType      Identity-H       yes yes yes     18  0',
].join('\n');

const input = (change: Record<string, unknown> = {}) => ({
  kind: 'cv' as const,
  bytes: 60 * 1024,
  pdfinfo: pdfinfo(2),
  pdffonts: embeddedFonts,
  text: textOf(paragraphs, long),
  docx: { paragraphs },
  phone: PHONE,
  ...change,
});
const rules = (result: { problems: Problem[] }) => result.problems.map((p) => p.rule);

describe('what pdfinfo and pdffonts print', () => {
  it('gives the pages and the size of each page', () => {
    expect(parsePageCount(pdfinfo(3))).toBe(3);
    expect(parsePageSizes(pdfinfo(3))).toEqual(Array(3).fill({ width: 595.276, height: 841.89 }));
    expect(parsePageCount('nothing')).toBeUndefined();
  });

  it('reads the one Page size line of an older pdfinfo', () => {
    expect(parsePageSizes('Pages: 1\nPage size:      595.276 x 841.89 pts (A4)\n')).toEqual([
      { width: 595.276, height: 841.89 },
    ]);
    expect(parsePageSizes('')).toEqual([]);
  });

  it('gives each font without the six letters of a subset, and whether it is embedded', () => {
    expect(parseFonts(embeddedFonts)).toEqual([
      { name: 'Calibri', embedded: true },
      { name: 'Calibri-Bold', embedded: true },
    ]);
    const loose = embeddedFonts.replace(
      'Identity-H       yes yes yes     18',
      'Identity-H       no  no  yes     18',
    );
    expect(parseFonts(loose).map((f) => f.embedded)).toEqual([true, false]);
    expect(parseFonts('no table here')).toEqual([]);
    expect(parseFonts('name type emb\n---- ---- ---\n')).toEqual([]);
  });

  it('copes with a type that has spaces, such as Type 1C', () => {
    const table = `${embeddedFonts}\nHelvetica                            Type 1            WinAnsi          no  no  no       6  0`;
    expect(parseFonts(table).at(-1)).toEqual({ name: 'Helvetica', embedded: false });
  });
});

describe('the reading order', () => {
  it('finds each paragraph of the Word file in the text, in order, whatever the capitals and the spaces', () => {
    expect(outOfOrder(paragraphs, textOf(paragraphs))).toEqual([]);
    // The headings are capitals in the PDF, and the right tab of a role line is a run of spaces.
    expect(textOf(paragraphs)).toContain('SUMMARY');
    expect(textOf(paragraphs)).toContain('Surbana Jurong          Apr 2024');
  });

  it('folds a ligature of the PDF into its letters', () => {
    expect(outOfOrder([para('Office of the first')], 'the o\ufb03ce of the first')).toEqual([]);
  });

  it('does not look for the cells of a table, which a PDF sets in an order of its own', () => {
    expect(
      outOfOrder([...paragraphs.slice(0, 2), para('A cell nobody finds', true)], textOf(paragraphs)),
    ).toEqual([]);
  });

  it('names the paragraphs that come out of order, or are not there', () => {
    const swapped = textOf(paragraphs).replace('Summary', 'XX').replace('SUMMARY', 'XX');
    expect(outOfOrder(paragraphs, swapped).join()).toContain('summary');
    const lines = textOf(paragraphs).split('\n');
    [lines[4], lines[6]] = [lines[6]!, lines[4]!];
    expect(outOfOrder(paragraphs, lines.join('\n')).length).toBeGreaterThan(0);
  });

  it('does not look for the contact line, nor show what it says, because it holds the phone number', () => {
    const noContact = textOf(paragraphs).replace(PHONE, 'on request');
    expect(outOfOrder(paragraphs, noContact)).toEqual([]);
    const inBody = [para(`Call ${PHONE} today`), para('Summary')];
    expect(outOfOrder(inBody, 'SUMMARY')).toEqual([]);
  });

  it('looks for a Heading 2 by its title alone, because poppler may set its date after the rows under it', () => {
    const heading = { style: 'Heading2', text: 'AI-driven web platform\t4 months', inTable: false };
    const next = para('Responsibilities');
    expect(outOfOrder([heading, next], 'AI-driven web platform\nRole\n4 months\nResponsibilities')).toEqual(
      [],
    );
    // Any other paragraph with a tab is still looked for whole.
    const row = { style: 'Row', text: 'Backend\tNode.js', inTable: false };
    expect(outOfOrder([row], 'Backend\nNode.js')).toEqual([]);
    expect(outOfOrder([row], 'Backend only')).toHaveLength(1);
  });

  it('leaves out a mark before the text and a paragraph too short to look for', () => {
    expect(outOfOrder([para('— Lâm Đồng'), para('ab')], 'lâm đồng')).toEqual([]);
  });
});

describe('checkPdf', () => {
  it('passes a CV that is small, A4, in 2 pages, with embedded fonts, selectable text, in order, and one phone number', () => {
    const result = checkPdf(input());
    expect(result.problems).toEqual([]);
    expect(result.pages).toBe(2);
    expect(result.fonts).toEqual(['Calibri', 'Calibri-Bold']);
    expect(result.substituted).toBe(false);
  });

  it('refuses a file over the limit: 300 KB for the CV, 400 KB for the portfolio', () => {
    expect(rules(checkPdf(input({ bytes: MAX_BYTES.cv + 1 })))).toEqual(['size']);
    expect(
      rules(checkPdf(input({ kind: 'portfolio', bytes: MAX_BYTES.cv + 1, pdfinfo: pdfinfo(3) }))),
    ).toEqual([]);
    expect(
      rules(checkPdf(input({ kind: 'portfolio', bytes: MAX_BYTES.portfolio + 1, pdfinfo: pdfinfo(3) }))),
    ).toEqual(['size']);
    expect(MAX_BYTES).toEqual({ cv: 300 * 1024, portfolio: 400 * 1024, combined: 500 * 1024 });
  });

  it.each([
    ['cv', 1, true],
    ['cv', 2, false],
    ['cv', 3, false],
    ['cv', 4, true],
    ['portfolio', 2, true],
    ['portfolio', 3, false],
    ['portfolio', 4, false],
    ['portfolio', 5, true],
    ['combined', 3, true],
    ['combined', 4, false],
    ['combined', 6, false],
    ['combined', 7, true],
  ] as const)('a %s of %i pages fails: %s', (kind, pages, fails) => {
    const result = checkPdf(input({ kind, pdfinfo: pdfinfo(pages) }));
    expect(rules(result).includes('pages')).toBe(fails);
    expect(PAGE_RANGE.cv).toEqual([2, 3]);
    expect(PAGE_RANGE.portfolio).toEqual([3, 4]);
    expect(PAGE_RANGE.combined).toEqual([4, 6]);
  });

  it('refuses a page that is not A4, such as Letter, and a pdfinfo that does not say', () => {
    const letter = checkPdf(input({ pdfinfo: pdfinfo(2, '612 x 792') }));
    expect(rules(letter)).toEqual(['a4']);
    expect(letter.problems[0]!.message).toContain('612 x 792');
    expect(rules(checkPdf(input({ pdfinfo: 'Pages: 2\n' })))).toEqual(['a4']);
    expect(rules(checkPdf(input({ pdfinfo: '' })))).toEqual(['pages', 'a4']);
  });

  it('accepts the A4 of Word, which is a hair different from the one of LibreOffice', () => {
    expect(rules(checkPdf(input({ pdfinfo: pdfinfo(2, '595.32 x 841.92') })))).toEqual([]);
  });

  it('refuses a font that is not embedded, and a PDF with no font', () => {
    const loose = embeddedFonts.replace(
      'Identity-H       yes yes yes     18',
      'Identity-H       no  no  yes     18',
    );
    const result = checkPdf(input({ pdffonts: loose }));
    expect(rules(result)).toEqual(['fonts']);
    expect(result.problems[0]!.message).toContain('Calibri-Bold');
    expect(rules(checkPdf(input({ pdffonts: '' })))).toEqual(['fonts']);
  });

  it('refuses a PDF with no text to select', () => {
    expect(rules(checkPdf(input({ text: '' })))).toContain('text');
  });

  it('notes that the fonts are not Calibri when LibreOffice used others', () => {
    const other = embeddedFonts
      .replaceAll('Calibri-Bold', 'DejaVuSans')
      .replaceAll('Calibri', 'LiberationSans');
    expect(checkPdf(input({ pdffonts: other })).substituted).toBe(true);
    expect(checkPdf(input({ pdffonts: embeddedFonts.replaceAll('Calibri', 'Carlito') })).substituted).toBe(
      false,
    );
  });

  it('refuses text in which the paragraphs are not in the order of the Word file', () => {
    const lines = textOf(paragraphs, long).split('\n');
    [lines[4], lines[6]] = [lines[6]!, lines[4]!];
    const result = checkPdf(input({ text: lines.join('\n') }));
    expect(rules(result)).toEqual(['order']);
    expect(result.problems[0]!.message).toMatch(/not in the text of the PDF in the same order, from "/);
  });

  describe('the phone number', () => {
    const withPhone = (text: string) => checkPdf(input({ text })).problems.filter((p) => p.rule === 'phone');

    it('has to be written once, and no other line may look like one', () => {
      expect(withPhone(textOf(paragraphs, long))).toEqual([]);
      const none = textOf(paragraphs, long).replace(PHONE, 'on request');
      expect(
        withPhone(none)
          .map((p) => p.message)
          .join(),
      ).toMatch(/written 0 times/);
      expect(
        withPhone(none)
          .map((p) => p.message)
          .join(),
      ).toMatch(/0 lines of the text/);
    });

    it('fails when it is written twice, without repeating it', () => {
      const twice = `${textOf(paragraphs, long)}\nCall ${PHONE} now`;
      const problems = withPhone(twice);
      expect(problems.map((p) => p.message).join()).toMatch(/written 2 times/);
      expect(problems.map((p) => p.message).join()).toMatch(/2 lines of the text/);
      for (const problem of problems) expect(problem.message).not.toContain(NINE);
    });

    it('never shows the number in the message about the order, even when the contact line is the one that is lost', () => {
      const text = textOf(paragraphs, long).replace(PHONE, 'on request');
      const messages = checkPdf(input({ text })).problems.map((p) => p.message);
      expect(messages.length).toBeGreaterThan(0);
      for (const message of messages) expect(message.replace(/\D/g, '')).not.toContain(NINE);
    });

    it('fails when the PDF has another number than the private file', () => {
      const other = ['0', NINE.slice(8), NINE.slice(0, 8)].join('');
      const text = textOf(paragraphs, long).replace(PHONE, other);
      expect(
        withPhone(text)
          .map((p) => p.message)
          .join(),
      ).toMatch(/written 0 times/);
    });
  });
});
