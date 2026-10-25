// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { pages, render } from './entry-server';

/** Puts the page for `path` where the browser would: the head and the markup the prerender writes into `index.html`. */
function load(path: string): void {
  const { html, head } = render(path);
  document.documentElement.lang = 'en';
  document.head.innerHTML = `<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />${head}`;
  document.body.innerHTML = `<div id="root">${html}</div>`;
}

/** One entry per violation: the rule, what it says and the markup it found, so a failure names the element. */
function violationsOf(results: axe.AxeResults): string[] {
  return results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n` +
      v.nodes.map((n) => `    ${n.target.join(' ')}\n      ${n.html.slice(0, 160)}`).join('\n'),
  );
}

const routes = pages().map((route) => route.path);

describe('the axe harness', () => {
  it('reports a missing alt text and a missing lang, so a green run means something', async () => {
    document.documentElement.removeAttribute('lang');
    document.head.innerHTML = '<title>Test</title>';
    document.body.innerHTML = '<main><h1>Test</h1><img src="/images/x.png" width="10" height="10"></main>';
    const results = await axe.run(document.documentElement, {
      rules: { 'color-contrast': { enabled: false } },
      resultTypes: ['violations'],
    });
    expect(results.violations.map((v) => v.id)).toEqual(
      expect.arrayContaining(['image-alt', 'html-has-lang']),
    );
  });
});

describe('accessibility of the prerendered pages', () => {
  it('covers the home page, the CV, every case study and the 404 page', () => {
    expect(routes).toEqual(expect.arrayContaining(['/', '/cv/', '/404.html', '/work/ops-command-center/']));
  });

  describe.each(routes)('%s', (path) => {
    beforeEach(() => load(path));

    it('has no axe violations', { timeout: 30_000 }, async () => {
      const results = await axe.run(document.documentElement, {
        // jsdom has no layout and no cascade, so it cannot compute colours; contrast is checked on the tokens
        // (V1-01.2, `tokens.test.ts`).
        rules: { 'color-contrast': { enabled: false } },
        resultTypes: ['violations'],
      });
      expect(violationsOf(results)).toEqual([]);
    });

    it('has one h1', () => {
      expect(document.querySelectorAll('h1')).toHaveLength(1);
    });

    it('gives every image an alt attribute', () => {
      for (const img of document.querySelectorAll('img')) {
        expect(img.hasAttribute('alt'), img.outerHTML.slice(0, 120)).toBe(true);
      }
    });
  });
});
