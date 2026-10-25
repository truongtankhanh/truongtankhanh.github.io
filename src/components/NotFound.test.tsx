import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { resume } from '../content/resume';
import { NotFound } from './NotFound';

/** React separates adjacent text nodes with `<!-- -->`; drop them so the text reads as written. */
const html = (r = resume) => renderToString(<NotFound resume={r} />).replaceAll('<!-- -->', '');
const published = { ...resume, cv: { ...resume.cv, published: true, bytes: 184_320 } };
const unpublished = { ...resume, cv: { ...resume.cv, published: false } };

describe('NotFound', () => {
  it('has one h1, the message, and the label above it', () => {
    const markup = html();
    expect(markup.match(/<h1[ >]/g)).toHaveLength(1);
    expect(markup).toMatch(/<h1 [^>]*>This page isn’t here\.<\/h1>/);
    expect(markup).toContain('Error 404 · Page not found');
  });

  it('draws the numerals as decoration, hidden from assistive technology', () => {
    const markup = html();
    const code = markup.match(/<p class="nf-code" aria-hidden="true">(.*?)<\/p>/)?.[1] ?? '';
    expect(code.match(/<b class="text-silver">4<\/b>/g)).toHaveLength(2);
    expect(code).toContain('class="nf-zero"');
  });

  it('keeps the header and links to the home sections from the root, because it is served at any depth', () => {
    const markup = html();
    expect(markup).toContain('<header class="site-header">');
    expect(markup).toContain('href="/#work"');
    expect(markup).not.toMatch(/href="#(?!main)/);
    expect(markup).toMatch(/<a [^>]*class="site-name"[^>]*href="\/"/);
  });

  it('has four tiles: work, experience, how I work, contact', () => {
    const list = html().match(/<ul class="nf-links"[^>]*>(.*?)<\/ul>/)?.[1] ?? '';
    const tiles = [...list.matchAll(/<a class="tile" href="([^"]+)"><span class="tile-name">([^<]+)</g)];
    expect(tiles.map((t) => [t[1], t[2]])).toEqual([
      ['/#work', 'Work'],
      ['/#experience', 'Experience'],
      ['/#approach', 'How I work'],
      ['/#contact', 'Contact'],
    ]);
  });

  it('words each tile note from the content, so it states nothing the content does not', () => {
    const markup = html();
    expect(markup).toContain(`${resume.projects.length} public repositories`);
    expect(markup).toContain('Roles since 2018');
  });

  it('has no relative URL', () => {
    expect(html().match(/\s(?:href|src)="(?![/#]|[a-z][a-z0-9+.-]*:)[^"]*"/gi)).toBeNull();
  });

  it('offers the CV only once the PDF is shipped, and then says it is one click away', () => {
    expect(html(unpublished)).not.toContain('Download CV (PDF)');
    expect(html(unpublished)).not.toContain('one click away');
    const markup = html(published);
    expect(markup).toContain(`href="${resume.cv.pdf}"`);
    expect(markup).toContain('Download CV (PDF)');
    expect(markup).toContain('aria-label="Download CV, PDF, 180 KB"');
    expect(markup).toContain('and the CV is one click away.');
  });

  it('always offers the way back to the home page', () => {
    expect(html(unpublished)).toMatch(/<a class="btn btn-primary btn-on-band" href="\/">.*Back to home/);
  });
});
