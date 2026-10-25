import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { resume } from '../content/resume';
import { Contact } from './Contact';

const published = { ...resume, cv: { ...resume.cv, published: true, bytes: 184_320 } };

const render = (r = resume) =>
  // React separates adjacent text nodes with `<!-- -->`; drop them so the text reads as written.
  renderToString(<Contact resume={r} />)
    .replaceAll('<!-- -->', '')
    .replaceAll('<wbr/>', '');

describe('Contact', () => {
  it('is the contact section, labelled by its heading, with a decorative wave on top', () => {
    const markup = render();
    expect(markup).toContain('<section id="contact" class="contact" aria-labelledby="contact-title">');
    expect(markup).toContain('<h2 id="contact-title">Let’s talk</h2>');
    expect(markup).toMatch(/<svg class="wave-top"[^>]*aria-hidden="true"/);
  });

  it('says how I am available and where I work, in the words of the content', () => {
    expect(render()).toContain(
      `${resume.availability}. Email is the quickest way to reach me; I work in ${resume.timezone}.`,
    );
  });

  it('makes the email the main action: a mailto link that announces when it has copied the address', () => {
    const markup = render();
    expect(markup).toContain(`<a class="mail-card" href="mailto:${resume.email}">`);
    expect(markup).toContain('<span class="mail-label" aria-live="polite">Email me</span>');
    expect(markup).toContain(`<b>${resume.email}</b>`);
  });

  it('adds two quieter tiles without the PDF: GitHub and LinkedIn', () => {
    expect(render().split('<a class="tile"').slice(1)).toHaveLength(2);
    expect(render()).not.toContain('Download CV');
  });

  it('adds three quieter tiles once the PDF is shipped: GitHub, LinkedIn and the CV, each with a note read from the content', () => {
    const tiles = render(published).split('<a class="tile"').slice(1);
    expect(tiles).toHaveLength(3);
    expect(tiles[0]).toContain(`href="${resume.links.github}"`);
    expect(tiles[0]).toContain('<span class="tile-note">github.com/truongtankhanh</span>');
    expect(tiles[1]).toContain(`href="${resume.links.linkedin}"`);
    expect(tiles[1]).toContain('<span class="tile-note">linkedin.com/in/truongtankhanh</span>');
    expect(tiles[2]).toContain(`href="${resume.cv.pdf}" download="${resume.cv.fileName}"`);
    expect(tiles[2]).toContain('aria-label="Download CV, PDF, 180 KB"');
    expect(tiles[2]).toContain('<span class="tile-name">Download CV</span>');
  });

  it('adds a quiet "Print the CV" link to the CV page, outside the tiles and not as a button', () => {
    const markup = render();
    expect(markup).toContain('<a class="btn-text btn-on-band" href="/cv/">Print the CV</a>');
    expect(markup.indexOf('Print the CV')).toBeGreaterThan(markup.lastIndexOf('<a class="tile"'));
    const withPdf = render(published);
    expect(withPdf.indexOf('Print the CV')).toBeGreaterThan(withPdf.lastIndexOf('<a class="tile"'));
    expect(markup.match(/href="\/cv\/"/g)).toHaveLength(1);
  });
});
