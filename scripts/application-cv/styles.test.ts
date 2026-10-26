import { describe, expect, it } from 'vitest';

interface RunProps {
  font?: Record<string, string>;
  size?: number;
  bold?: boolean;
  allCaps?: boolean;
  color?: string;
  characterSpacing?: number;
}
interface ParagraphStyle {
  id: string;
  name: string;
  basedOn?: string;
  run?: RunProps;
  paragraph?: {
    keepNext?: boolean;
    keepLines?: boolean;
    pageBreakBefore?: boolean;
    outlineLevel?: number;
    spacing?: { line?: number; before?: number; after?: number };
    tabStops?: { type: string; position: number }[];
    indent?: { left: number; hanging: number };
    shading?: { fill: string };
    border?: Record<'top' | 'bottom' | 'left' | 'right', { color: string; size: number; space: number }>;
    numbering?: { reference: string; level: number };
  };
}
interface CharacterStyle {
  id: string;
  name: string;
  run: RunProps;
}
interface Sheet {
  COLORS: Record<'ink' | 'muted' | 'accent' | 'steel' | 'gold' | 'white' | 'mist' | 'tint', string>;
  FONT: { preferred: string; fallback: string };
  PAGE: { size: { width: number; height: number }; margin: Record<string, number> };
  TEXT_WIDTH: number;
  ROW_INDENT: number;
  FIELD_INDENT: number;
  BULLETS: string;
  STYLE: Record<
    | 'title'
    | 'subtitle'
    | 'heading1'
    | 'heading2'
    | 'normal'
    | 'bullet'
    | 'date'
    | 'caption'
    | 'contact'
    | 'location'
    | 'figureStrip'
    | 'part'
    | 'row'
    | 'field'
    | 'cell'
    | 'repo'
    | 'repoLink'
    | 'roleTitle'
    | 'footer'
    | 'strong'
    | 'hyperlink'
    | 'bandLink'
    | 'figure'
    | 'mark'
    | 'dateRun',
    string
  >;
  createStyles(options?: { font?: string }): {
    styles: { paragraphStyles: ParagraphStyle[]; characterStyles: CharacterStyle[] };
    numbering: {
      config: {
        reference: string;
        levels: { format: string; text: string; style: { run: { color: string } } }[];
      }[];
    };
  };
}

// The module is plain JavaScript; a computed specifier keeps the type checker out of it.
const path = './styles.mjs';
const sheet = (await import(path)) as Sheet;
const { COLORS, FONT, PAGE, TEXT_WIDTH, ROW_INDENT, FIELD_INDENT, STYLE, BULLETS, createStyles } = sheet;
const { styles, numbering } = createStyles();

const paragraph = (id: string) => {
  const found = styles.paragraphStyles.find((s) => s.id === id);
  if (!found) throw new Error(`no paragraph style ${id}`);
  return found;
};

/** Every value of `key` anywhere in `node`. */
function collect(node: unknown, key: string, out: string[] = []): string[] {
  if (Array.isArray(node)) node.forEach((item) => collect(item, key, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === key && typeof v === 'string') out.push(v);
      else collect(v, key, out);
    }
  }
  return out;
}

/** WCAG 2 contrast ratio between two `RRGGBB` colours, as in `src/styles/tokens.test.ts`. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
      number,
      number,
      number,
    ];
    const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(bl);
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('application CV style sheet', () => {
  it('defines the named styles of V1-20.1 and no others', () => {
    expect(styles.paragraphStyles.map((s) => s.name).sort()).toEqual(
      [
        'Contact',
        'Date',
        'Field',
        'Figure Strip',
        'List Bullet',
        'Location',
        'Normal',
        'Part Title',
        'Repo',
        'Repo Link',
        'Role Title',
        'Row',
        'Subtitle',
        'Table Text',
        'Title',
        'caption',
        'footer',
        'heading 1',
        'heading 2',
      ].sort(),
    );
    const ids = [...styles.paragraphStyles, ...styles.characterStyles].map((s) => s.id).sort();
    expect(ids).toEqual(Object.values(STYLE).sort());
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses the palette and nothing else, and no black', () => {
    const palette = Object.values(COLORS);
    expect(new Set(palette).size).toBe(palette.length);
    const used = [...collect(styles, 'color'), ...collect(numbering, 'color')];
    expect(used.length).toBeGreaterThan(0);
    for (const color of used) expect(palette).toContain(color);
    expect(used).not.toContain('000000');
    expect(JSON.stringify([styles, numbering])).not.toMatch(/"color":"auto"/);
  });

  it('keeps steel for the rule, gold for the mark and the tint for the strip, and all text at 4.5:1 on its ground', () => {
    const text = [...styles.paragraphStyles.map((s) => s.run), ...styles.characterStyles.map((s) => s.run)]
      .map((run) => run?.color)
      .filter((c): c is string => Boolean(c));
    expect(text).not.toContain(COLORS.steel);
    expect(text).not.toContain(COLORS.tint);
    expect(styles.characterStyles.filter((s) => s.run.color === COLORS.gold).map((s) => s.id)).toEqual([
      STYLE.mark,
    ]);
    expect(paragraph(STYLE.heading1).paragraph?.border?.bottom.color).toBe(COLORS.steel);
    for (const color of [COLORS.ink, COLORS.muted, COLORS.accent]) {
      expect(contrast(color, 'FFFFFF'), color).toBeGreaterThanOrEqual(4.5);
    }
    // The text of the strip is ink, muted or accent on the tint; the text of the band is white or mist on the ink, and
    // the gold mark is on the ink too.
    for (const color of [COLORS.ink, COLORS.muted, COLORS.accent]) {
      expect(contrast(color, COLORS.tint), color).toBeGreaterThanOrEqual(4.5);
    }
    for (const color of [COLORS.white, COLORS.mist, COLORS.gold]) {
      expect(contrast(color, COLORS.ink), color).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('sets the type of V1-20.1', () => {
    const size = (id: string) => paragraph(id).run?.size;
    expect(size(STYLE.title)).toBe(52); // 26 pt
    expect(size(STYLE.subtitle)).toBe(24); // 12 pt
    expect(size(STYLE.heading1)).toBe(20); // 10 pt
    expect(size(STYLE.heading2)).toBe(23); // 11.5 pt
    expect(size(STYLE.normal)).toBe(20); // 10 pt
    expect(size(STYLE.date)).toBe(18); // 9 pt
    expect(size(STYLE.caption)).toBe(18);
    expect(paragraph(STYLE.title).run?.color).toBe(COLORS.white);
    expect(paragraph(STYLE.subtitle).run?.color).toBe(COLORS.mist);
    expect(paragraph(STYLE.date).run?.color).toBe(COLORS.muted);
    const h1 = paragraph(STYLE.heading1);
    expect(h1.run).toMatchObject({ bold: true, allCaps: true, color: COLORS.accent, characterSpacing: 24 });
  });

  it('spaces paragraphs at 1.15 lines, 3 pt after, 10 pt before a section', () => {
    expect(paragraph(STYLE.normal).paragraph?.spacing).toMatchObject({ line: 269, after: 50 });
    expect(paragraph(STYLE.heading1).paragraph?.spacing?.before).toBe(200);
  });

  it('gives the outline to the headings and keeps a heading with what follows it', () => {
    const h1 = paragraph(STYLE.heading1).paragraph;
    const h2 = paragraph(STYLE.heading2).paragraph;
    expect(h1?.outlineLevel).toBe(0);
    expect(h2?.outlineLevel).toBe(1);
    for (const h of [h1, h2]) expect(h).toMatchObject({ keepNext: true, keepLines: true });
  });

  it('makes the bullet a numbering definition in accent, never a typed character', () => {
    expect(paragraph(STYLE.bullet).paragraph?.numbering).toEqual({ reference: BULLETS, level: 0 });
    const level = numbering.config.find((c) => c.reference === BULLETS)?.levels[0];
    expect(level).toMatchObject({ format: 'bullet', text: '•' });
    expect(level?.style.run.color).toBe(COLORS.accent);
  });

  it('is A4 with 15 mm at the sides, 12 mm at the top, 15 mm at the bottom, and the footer 8 mm from the edge', () => {
    const twips = (mm: number) => Math.round((mm * 1440) / 25.4);
    expect(PAGE.size).toEqual({ width: 11906, height: 16838 }); // A4
    expect(PAGE.margin).toMatchObject({
      left: twips(15),
      right: twips(15),
      top: twips(12),
      bottom: twips(15),
      header: twips(10),
      footer: twips(8),
    });
    expect(TEXT_WIDTH).toBe(PAGE.size.width - 2 * twips(15));
  });

  it('puts the first-page block on one navy band: the same shading and border on every paragraph, so Word draws one box', () => {
    const block = [STYLE.location, STYLE.title, STYLE.subtitle, STYLE.contact].map(paragraph);
    for (const { paragraph: p } of block) {
      expect(p?.shading?.fill).toBe(COLORS.ink);
      expect(p?.border).toEqual(block[0]!.paragraph?.border);
    }
    const border = block[0]!.paragraph!.border!;
    expect(Object.values(border).every((side) => side.color === COLORS.ink)).toBe(true);
    // Left and right reach beyond the text; the band must stay inside the page: 15 mm margin is 42.5 pt.
    expect(border.left.space).toBeGreaterThan(0);
    expect(border.left.space).toBeLessThan(42);
    expect(border.left.space).toBe(border.right.space);
  });

  it('sets the strip of figures in the tint, as wide as the band, and closes the page with a steel rule over an 8.5 pt footer', () => {
    const strip = paragraph(STYLE.figureStrip).paragraph;
    expect(strip?.shading?.fill).toBe(COLORS.tint);
    expect(strip?.border?.left.space).toBe(paragraph(STYLE.title).paragraph?.border?.left.space);
    const footer = paragraph(STYLE.footer);
    expect(footer.paragraph?.border?.top).toMatchObject({ color: COLORS.steel });
    expect(footer.run).toMatchObject({ size: 17, color: COLORS.muted }); // 8.5 pt
  });

  it('starts the portfolio part of the one-file edition on a new page, in the outline, over an accent rule', () => {
    const part = paragraph(STYLE.part);
    expect(part.paragraph).toMatchObject({ pageBreakBefore: true, keepNext: true, outlineLevel: 0 });
    expect(part.paragraph?.border?.bottom).toMatchObject({ color: COLORS.accent });
    expect(part.run?.size).toBe(36); // 18 pt
  });

  it('sets a label column with a hanging indent and a tab on its edge, in two widths', () => {
    for (const [id, width] of [
      [STYLE.row, ROW_INDENT],
      [STYLE.field, FIELD_INDENT],
    ] as const) {
      const p = paragraph(id).paragraph;
      expect(p?.indent).toEqual({ left: width, hanging: width });
      expect(p?.tabStops).toEqual([{ type: 'left', position: width }]);
    }
    expect(ROW_INDENT).toBeGreaterThan(FIELD_INDENT);
  });

  it('puts a right tab stop on the edge of the text for the logo, the dates and the page count', () => {
    for (const id of [STYLE.title, STYLE.heading2, STYLE.footer]) {
      expect(paragraph(id).paragraph?.tabStops).toEqual([{ type: 'right', position: TEXT_WIDTH }]);
    }
  });

  it('sets one font everywhere: Calibri by default, Be Vietnam Pro when asked', () => {
    const fonts = (s: ReturnType<typeof createStyles>) => new Set(collect(s, 'ascii'));
    expect(fonts(createStyles())).toEqual(new Set([FONT.fallback]));
    expect(fonts(createStyles({ font: FONT.preferred }))).toEqual(new Set([FONT.preferred]));
  });
});
