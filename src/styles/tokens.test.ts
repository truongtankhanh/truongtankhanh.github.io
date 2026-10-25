import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

/** Colour tokens declared in one block of the stylesheet, e.g. `--ink` to `#0b1b33`. */
function tokens(block: RegExp): Record<string, string> {
  const body = block.exec(css)?.[1];
  if (!body) throw new Error(`No block matches ${block}`);
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)].map((m) => [m[1]!, m[2]!]));
}

const light = tokens(/^:root \{([^}]*)\}/m);
// The dark theme only overrides some tokens (gold and glow stay as they are in light).
const dark = { ...light, ...tokens(/^:root\[data-theme='dark'\] \{([^}]*)\}/m) };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2 contrast ratio between two `#rrggbb` colours. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT_PAIRS: [string, string][] = [
  ['ink', 'paper'],
  ['muted', 'paper'],
  ['muted', 'surface'],
  ['muted', 'wash'],
  ['accent', 'paper'],
  ['on-accent', 'accent'],
  ['btn-ink', 'btn-top'],
  ['btn-ink', 'btn-bot'],
  ['on-band', 'band'],
  ['gold', 'band'],
  ['glow', 'band'],
];

describe.each([
  ['light', light],
  ['dark', dark],
] as const)('%s theme contrast', (_name, theme) => {
  it.each(TEXT_PAIRS)('%s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrast(theme[fg]!, theme[bg]!)).toBeGreaterThanOrEqual(4.5);
  });

  // Dark gold on the light surfaces; on the bands the ring is `gold` in light mode (checked above at 4.5:1),
  // and `focus` itself in dark mode, where it is gold already.
  it.each(['paper', 'surface', 'wash', 'plate-top', 'plate-bot'])(
    'the focus ring on %s is at least 3:1',
    (bg) => {
      expect(contrast(theme['focus']!, theme[bg]!)).toBeGreaterThanOrEqual(3);
    },
  );
});

describe('focus ring on the current tab', () => {
  // The ring inside a tab or menu row that is filled in the light band colour is drawn in the band colour.
  it.each([
    ['light', light],
    ['dark', dark],
  ] as const)('is at least 3:1 on the fill in the %s theme', (_name, theme) => {
    expect(contrast(theme['band']!, theme['on-band']!)).toBeGreaterThanOrEqual(3);
  });
});

describe('focus ring on the bands', () => {
  it('is visible in both themes', () => {
    expect(contrast(light['gold']!, light['band']!)).toBeGreaterThanOrEqual(3);
    expect(contrast(dark['focus']!, dark['band']!)).toBeGreaterThanOrEqual(3);
  });
});

describe('stylesheet', () => {
  // Everything after the token blocks (they end where the first rule of the page begins).
  const rules = css.slice(css.indexOf('*,\n*::before')).replace(/\/\*[\s\S]*?\*\//g, '');

  it('has the token blocks before the first rule', () => {
    expect(css.indexOf('*,\n*::before')).toBeGreaterThan(css.indexOf(":root[data-theme='dark']"));
  });

  it('has no literal colour below the token blocks, so both themes and print follow the tokens', () => {
    const literals = rules.match(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\b(?:white|black)\b(?![-\w])/gi);
    expect(literals).toBeNull();
  });
});

describe('motion and forced colours', () => {
  it('smooths scrolling only for visitors who have not asked for reduced motion', () => {
    const at = [...css.matchAll(/scroll-behavior:\s*smooth/g)].map((m) => m.index!);
    expect(at.length).toBeGreaterThan(0);
    for (const i of at) {
      const before = css.slice(0, i);
      expect(before.slice(before.lastIndexOf('@media'))).toMatch(
        /^@media \(prefers-reduced-motion: no-preference\)/,
      );
    }
  });

  describe('forced-colors blocks', () => {
    const forced = [...css.matchAll(/@media \(forced-colors: active\) \{[\s\S]*?\n\}/g)]
      .map((m) => m[0])
      .join('\n');

    it('hide the decorative sun, waves and pulses', () => {
      for (const part of ['.hero-sun', '.hero-waves', '.hero-stack::after', '.arch-edge i::before']) {
        expect(forced, part).toContain(part);
      }
      expect(forced).toMatch(/\.hero-sun[\s\S]*?display: none/);
    });

    it('draw gradient-clipped text, plates and cards in system colours', () => {
      expect(forced).toMatch(/\.text-silver,\s*\.text-gold \{[^}]*CanvasText/);
      expect(forced).toMatch(/\.tile[\s\S]*?border-color: CanvasText/);
    });

    it('mark the current tab with a Highlight outline', () => {
      expect(forced).toMatch(/\.site-header nav a\[aria-current\][\s\S]*?outline: 2px solid Highlight/);
    });

    it('let the logo keep its own colours', () => {
      expect(forced).toMatch(/\.brand-mark \{\s*forced-color-adjust: none/);
    });
  });
});
