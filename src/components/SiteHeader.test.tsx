import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { App } from '../App';
import { resume } from '../content/resume';
import { SiteHeader } from './SiteHeader';

const html = () => renderToString(<SiteHeader />);

/** The `href` and text of each link inside the first element that matches `open` ... `close`. */
function links(markup: string, open: string, close: string) {
  const start = markup.indexOf(open);
  const body = markup.slice(start, markup.indexOf(close, start));
  return [...body.matchAll(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g)].map((m) => [m[1], m[2]]);
}

describe('SiteHeader', () => {
  const sections = [
    ['#work', 'Work'],
    ['#experience', 'Experience'],
    ['#skills', 'Skills'],
    ['#approach', 'How I work'],
    ['#contact', 'Contact'],
  ];

  it('offers the five sections in page order, in the tabs and in the menu', () => {
    const markup = html();
    expect(links(markup, '<nav', '</nav>')).toEqual(sections);
    expect(links(markup, 'id="site-menu"', '</header>')).toEqual(sections);
  });

  it('only links to sections that exist on the page', () => {
    const page = renderToString(<App />);
    for (const [href] of sections) expect(page).toContain(`id="${href!.slice(1)}"`);
  });

  it('makes the lockup one link to the top, with the name and the role beside the mark', () => {
    const markup = html();
    const lockup = markup.match(/<a [^>]*href="#top"[^>]*>(.*?)<\/a>/)?.[1] ?? '';
    expect(markup.match(/href="#top"/g)).toHaveLength(1);
    expect(lockup).toContain('<svg');
    expect(lockup).toContain(`lang="vi">${resume.name}</span>`);
    expect(lockup).toContain(`>${resume.headline}</span>`);
  });

  it('wires the menu button to a panel that is a div, not a second nav', () => {
    const markup = html();
    expect(markup).toMatch(
      /<button [^>]*aria-expanded="false"[^>]*aria-controls="site-menu"[^>]*aria-label="Open menu"/,
    );
    expect(markup).toMatch(/<div id="site-menu" class="site-menu" role="navigation"/);
    expect(markup.match(/<nav[ >]/g)).toHaveLength(1);
  });

  it('keeps the theme toggle labelled', () => {
    expect(html()).toContain('aria-label="Switch colour theme"');
  });

  describe('Download CV', () => {
    it('is hidden until the CV is published, so it never links to a 404', () => {
      expect(resume.cv.published).toBe(false);
      expect(html()).not.toContain('Download CV');
    });

    it('is a link to the PDF once the CV is published', () => {
      resume.cv.published = true;
      try {
        const markup = html();
        expect(markup).toContain(`href="${resume.cv.pdf}"`);
        expect(markup).toContain(`download="${resume.cv.fileName}"`);
        expect(markup).toContain('aria-label="Download CV"');
      } finally {
        resume.cv.published = false;
      }
    });
  });
});
