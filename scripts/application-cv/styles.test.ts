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
    outlineLevel?: number;
    spacing?: { line?: number; before?: number; after?: number };
    tabStops?: { type: string; position: number }[];
    border?: Record<'top' | 'bottom', { color: string; size: number }>;
    numbering?: { reference: string; level: number };
  };
}
interface CharacterStyle {
  id: string;
  name: string;
  run: RunProps;
}
interface Sheet {
  COLORS: Record<'ink' | 'muted' | 'accent' | 'steel' | 'gold', string>;
  FONT: { preferred: string; fallback: string };
  PAGE: { size: { width: number; height: number }; margin: Record<string, number> };
  TEXT_WIDTH: number;
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
    | 'roleTitle'
    | 'footer'
    | 'strong'
    | 'hyperlink'
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
const { COLORS, FONT, PAGE, TEXT_WIDTH, STYLE, BULLETS, createStyles } = sheet;
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
        'List Bullet',
        'Normal',
        'Role Title',
        'Subtitle',
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

  it('keeps steel for the rule and gold for the mark, and all text at 4.5:1 on white', () => {
    const text = [...styles.paragraphStyles.map((s) => s.run), ...styles.characterStyles.map((s) => s.run)]
      .map((run) => run?.color)
      .filter((c): c is string => Boolean(c));
    expect(text).not.toContain(COLORS.steel);
    expect(styles.characterStyles.filter((s) => s.run.color === COLORS.gold).map((s) => s.id)).toEqual([
      STYLE.mark,
    ]);
    expect(paragraph(STYLE.heading1).paragraph?.border?.bottom.color).toBe(COLORS.steel);
    for (const color of [COLORS.ink, COLORS.muted, COLORS.accent]) {
      expect(contrast(color, 'FFFFFF'), color).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('sets the type of V1-20.1', () => {
    const size = (id: string) => paragraph(id).run?.size;
    expect(size(STYLE.title)).toBe(52); // 26 pt
    expect(size(STYLE.subtitle)).toBe(24); // 12 pt
    expect(size(STYLE.heading1)).toBe(20); // 10 pt
    expect(size(STYLE.heading2)).toBe(22); // 11 pt
    expect(size(STYLE.normal)).toBe(19); // 9.5 pt
    expect(size(STYLE.date)).toBe(17); // 8.5 pt
    expect(size(STYLE.caption)).toBe(17);
    expect(paragraph(STYLE.subtitle).run?.color).toBe(COLORS.accent);
    expect(paragraph(STYLE.date).run?.color).toBe(COLORS.muted);
    const h1 = paragraph(STYLE.heading1);
    expect(h1.run).toMatchObject({ bold: true, allCaps: true, color: COLORS.accent, characterSpacing: 24 });
  });

  it('spaces paragraphs at 1.15 lines, 3 pt after, 10 pt before a section', () => {
    expect(paragraph(STYLE.normal).paragraph?.spacing).toMatchObject({ line: 276, after: 60 });
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

  it('is A4 with 15 mm at the sides, 14 mm at the top and bottom, and 11 mm to the header and footer', () => {
    const twips = (mm: number) => Math.round((mm * 1440) / 25.4);
    expect(PAGE.size).toEqual({ width: 11906, height: 16838 }); // A4
    expect(PAGE.margin).toMatchObject({
      left: twips(15),
      right: twips(15),
      top: twips(14),
      bottom: twips(14),
      header: twips(11),
      footer: twips(11),
    });
    expect(TEXT_WIDTH).toBe(PAGE.size.width - 2 * twips(15));
  });

  it('closes the first-page block with a 1.5 pt accent rule and the page with a steel rule over an 8 pt footer', () => {
    const rule = paragraph(STYLE.contact).paragraph?.border?.bottom;
    expect(rule).toMatchObject({ color: COLORS.accent, size: 12 }); // eighths of a point
    const footer = paragraph(STYLE.footer);
    expect(footer.paragraph?.border?.top).toMatchObject({ color: COLORS.steel });
    expect(footer.run).toMatchObject({ size: 16, color: COLORS.muted }); // 8 pt
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
