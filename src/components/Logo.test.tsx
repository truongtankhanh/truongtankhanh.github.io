import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Logo } from './Logo';

const gradientIds = (html: string) =>
  [...html.matchAll(/<(?:linear|radial)Gradient id="([^"]+)"/g)].map((m) => m[1]);

describe('Logo', () => {
  it('gives two marks on one page different gradient ids', () => {
    const html = renderToString(
      <>
        <Logo variant="dark" />
        <Logo variant="dark" />
        <Logo variant="light" />
      </>,
    );
    const ids = gradientIds(html);
    // Six gradients per metallic mark: plate, rim, silver, gold, aqua and sun.
    expect(ids).toHaveLength(18);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('points every url() reference at an id that exists in the same mark', () => {
    for (const variant of ['dark', 'light'] as const) {
      const html = renderToString(<Logo variant={variant} />);
      const defined = new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
      const used = [...html.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
      expect(used.length).toBeGreaterThan(0);
      for (const id of used) expect(defined.has(id as string)).toBe(true);
    }
  });

  it('is hidden from assistive tech beside the name, and an image with a label otherwise', () => {
    expect(renderToString(<Logo />)).toContain('aria-hidden="true"');
    expect(renderToString(<Logo />)).not.toContain('role="img"');
    const labelled = renderToString(<Logo label="TK monogram" />);
    expect(labelled).toContain('role="img"');
    expect(labelled).toContain('aria-label="TK monogram"');
    expect(labelled).not.toContain('aria-hidden');
  });

  it('draws the mono variant flat, in currentColor', () => {
    const html = renderToString(<Logo variant="mono" />);
    expect(html).toContain('currentColor');
    expect(html).not.toMatch(/Gradient|<filter|url\(#/);
  });
});
