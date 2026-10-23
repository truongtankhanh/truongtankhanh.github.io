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
  it.each(['paper', 'surface', 'wash'])('the focus ring on %s is at least 3:1', (bg) => {
    expect(contrast(theme['focus']!, theme[bg]!)).toBeGreaterThanOrEqual(3);
  });
});

describe('focus ring on the bands', () => {
  it('is visible in both themes', () => {
    expect(contrast(light['gold']!, light['band']!)).toBeGreaterThanOrEqual(3);
    expect(contrast(dark['focus']!, dark['band']!)).toBeGreaterThanOrEqual(3);
  });
});
