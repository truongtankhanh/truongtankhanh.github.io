import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { resume } from '../content/resume';
import { Hero } from './Hero';

/** React separates adjacent text nodes with `<!-- -->`; drop them so the text reads as written. */
const html = () => renderToString(<Hero resume={resume} />).replaceAll('<!-- -->', '');

/** Each link inside the actions block: its `href` and its text. */
function actions(markup: string) {
  const start = markup.indexOf('class="hero-actions"');
  const body = markup.slice(start, markup.indexOf('</div>', start));
  return [...body.matchAll(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g)].map((m) => [
    m[1],
    m[2]!.replace(/<[^>]+>/g, ''),
  ]);
}

describe('Hero', () => {
  it('has one h1, the name, marked as Vietnamese', () => {
    const markup = html();
    expect(markup.match(/<h1[ >]/g)).toHaveLength(1);
    expect(markup).toMatch(new RegExp(`<h1 [^>]*lang="vi"[^>]*>${resume.name}</h1>`));
  });

  it('offers four actions, in order: email, CV, GitHub, LinkedIn', () => {
    expect(actions(html())).toEqual([
      [`mailto:${resume.email}`, 'Email me'],
      [resume.cv.pdf, 'Download CV (PDF)'],
      [resume.links.github, 'GitHub'],
      [resume.links.linkedin, 'LinkedIn'],
    ]);
  });

  it('announces "Email copied" through a polite live region that exists from the first render', () => {
    expect(html()).toContain('<span aria-live="polite">Email me</span>');
  });

  it('leads with the first intro paragraph only: the rest of the intro is the summary of the CV page', () => {
    const markup = html();
    const [lead, ...more] = resume.intro;
    expect(markup).toContain(`<p class="intro">${lead}</p>`);
    for (const p of more) expect(markup).not.toContain(p);
  });

  it('says how under the lead', () => {
    expect(html()).toContain(`<p class="where">${resume.availability}.</p>`);
  });

  it('states the current company and the number of public repositories, with a link to the work', () => {
    const markup = html();
    const current = resume.experience.find((r) => !r.end)!;
    expect(markup).toContain(`>${current.company}</dd>`);
    expect(markup).toContain('since April 2024');
    expect(markup).toContain(`${resume.projects.length} public repositories`);
    expect(markup).toMatch(/<a [^>]*href="#work"[^>]*>See the work<\/a>/);
  });

  it('lists every tool of the stack as text, with the core ones marked', () => {
    const markup = html();
    const stack = markup.slice(markup.indexOf('class="hero-stack"'));
    for (const layer of resume.heroStack) {
      expect(stack).toContain(`<ul aria-label="${layer.label}">`);
      for (const item of layer.items) {
        const core = resume.coreStack.includes(item);
        expect(stack).toContain(core ? `<li class="is-core">${item}</li>` : `<li>${item}</li>`);
      }
    }
  });

  it('gives each layer a hidden ring and a hidden lit node, drawn once and faded by the loop', () => {
    const markup = html();
    expect(markup.match(/<span class="hero-layer-glow" aria-hidden="true"><\/span>/g)).toHaveLength(
      resume.heroStack.length,
    );
    expect(markup.match(/<span class="hero-layer-node" aria-hidden="true"><\/span>/g)).toHaveLength(
      resume.heroStack.length,
    );
  });

  it('hides the sun and the waves from assistive technology', () => {
    const markup = html();
    expect(markup).toMatch(/<svg class="hero-sun"[^>]*aria-hidden="true"/);
    expect(markup).toMatch(/<div class="hero-waves" aria-hidden="true"/);
  });
});
