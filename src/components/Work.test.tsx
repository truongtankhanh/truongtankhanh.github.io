import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { resume } from '../content/resume';
import type { Project } from '../content/types';
import { Work } from './Work';

const render = (projects: Project[] = resume.projects) =>
  // React separates adjacent text nodes with `<!-- -->`; drop them so the text reads as written.
  renderToString(<Work projects={projects} architecture={resume.architecture} />).replaceAll('<!-- -->', '');
const [featured, ...others] = resume.projects as [Project, ...Project[]];

/** The markup of the first element that starts with `open`, up to and including its closing `tag`. */
function block(markup: string, open: string, tag: string) {
  const start = markup.indexOf(open);
  return markup.slice(start, markup.indexOf(`</${tag}>`, start) + tag.length + 3);
}

describe('Work', () => {
  it('is the work section, labelled by its heading', () => {
    const markup = render();
    expect(markup).toContain('<section id="work" class="section" aria-labelledby="work-title">');
    expect(markup).toContain('<h2 id="work-title">Public work</h2>');
  });

  it('features the first project with its description, stack and repository', () => {
    const card = block(render(), '<article class="featured', 'article');
    expect(card).toContain(`<h3>${featured.name}</h3>`);
    expect(card).toContain(featured.what);
    for (const item of featured.stack) expect(card).toContain(`<li class="chip">${item}</li>`);
    expect(card).toContain(`href="${featured.repo}"`);
  });

  it('lists what can be checked in the code, in the words of the project checks', () => {
    const side = block(render(), '<div class="featured-side">', 'ul');
    expect(side).toContain('What you can check in the code');
    for (const check of featured.checks) expect(side).toContain(`<span>${check}</span>`);
  });

  it('links to the case study only for a project that has one', () => {
    expect(render()).not.toContain('Read the case study');
    const withStudy = {
      ...featured,
      caseStudy: { slug: 'ops-command-center', lead: 'x', role: 'x', status: 'x' },
    };
    const markup = render([withStudy, ...others]);
    expect(markup).toMatch(/<a [^>]*href="\/work\/ops-command-center\/"[^>]*>Read the case study<\/a>/);
  });

  it('gives each of the other projects a card with its key figure, checks, stack and repository link', () => {
    const markup = render();
    const cards = markup.split('<article class="project-card').slice(1);
    expect(cards).toHaveLength(others.length);
    others.forEach((p, i) => {
      const card = cards[i]!;
      expect(card).toContain(`<h3>${p.name}</h3>`);
      expect(card).toContain(p.what);
      expect(card).toContain(
        `<span class="stat-value">${p.stat!.value}</span> <span>${p.stat!.label}</span>`,
      );
      for (const check of p.checks) expect(card).toContain(`<li>${check}</li>`);
      for (const item of p.stack) expect(card).toContain(`<li class="chip">${item}</li>`);
      expect(card).toContain(`href="${p.repo}">View repository<span class="sr-only"> for ${p.name}</span>`);
    });
  });

  it('shows every proof without a click, as the checks of its project', () => {
    const markup = render();
    for (const p of resume.projects) for (const check of p.checks) expect(markup).toContain(check);
  });

  it('links every repository on this GitHub account, and no card is a link by itself', () => {
    const markup = render();
    const repoLinks = [...markup.matchAll(/<a [^>]*href="(https:\/\/github\.com[^"]+)"/g)].map((m) => m[1]);
    expect(repoLinks).toEqual(resume.projects.map((p) => p.repo));
    for (const href of repoLinks) expect(href).toMatch(/^https:\/\/github\.com\/truongtankhanh\/[\w.-]+$/);
  });

  it('keeps the plain project list that the printed CV uses', () => {
    expect(render(resume.projects)).toContain('class="print-only print-projects"');
  });
});
