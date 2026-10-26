import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { sampleCaseStudy } from '../content/caseStudyFixture';
import { resume } from '../content/resume';
import type { Project } from '../content/types';
import { Work } from './Work';

const render = (projects: Project[] = resume.projects) =>
  // React separates adjacent text nodes with `<!-- -->`; drop them so the text reads as written.
  renderToString(<Work projects={projects} architecture={resume.architecture} />).replaceAll('<!-- -->', '');
/** The project as it was before it had a case study, so a test can add one and see the link appear. */
const without = (p: Project): Project => {
  const copy = { ...p };
  delete copy.caseStudy;
  return copy;
};
const bare = resume.projects.map(without);
const [featured, ...others] = bare as [Project, ...Project[]];

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
    expect(render(bare)).not.toContain('Read the case study');
    expect(render()).toMatch(/<a [^>]*href="\/work\/ops-command-center\/"[^>]*>Read the case study<\/a>/);
    const withStudy = {
      ...featured,
      caseStudy: sampleCaseStudy('ops-command-center'),
    };
    const markup = render([withStudy, ...others]);
    expect(markup).toMatch(/<a [^>]*href="\/work\/ops-command-center\/"[^>]*>Read the case study<\/a>/);
  });

  it('links a card to its case study only when that project has one, and names the project for screen readers', () => {
    const [second, ...rest] = others as [Project, ...Project[]];
    const withStudy = { ...second, caseStudy: sampleCaseStudy('iot-telemetry-pipeline') };
    const cards = render([featured, withStudy, ...rest])
      .split('<article class="project-card')
      .slice(1);
    expect(cards[0]).toContain(
      '<a href="/work/iot-telemetry-pipeline/">Read the case study<span class="sr-only"> for ' + second.name,
    );
    for (const card of cards.slice(1)) expect(card).not.toContain('Read the case study');
    expect(render(bare)).not.toContain('/work/');
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
  describe('the demo video', () => {
    const demo = resume.projects[0]!.caseStudy!.demo!;
    const withDemo = (published: boolean): Project[] => [
      { ...featured, caseStudy: { ...sampleCaseStudy('ops-command-center'), demo: { ...demo, published } } },
      ...others,
    ];
    const watch = /<a [^>]*href="\/work\/ops-command-center\/#demo"[^>]*>Watch the demo<\/a>/;

    it('adds "Watch the demo" to the featured card, after the case study, when the build found the video', () => {
      const markup = render(withDemo(true));
      expect(markup).toMatch(watch);
      expect(markup.indexOf('Read the case study')).toBeLessThan(markup.indexOf('Watch the demo'));
      expect(markup.indexOf('Watch the demo')).toBeLessThan(markup.indexOf('>Repository<'));
    });

    it('has no such action when the video was not found, or the project has no case study', () => {
      expect(render(withDemo(false))).not.toContain('Watch the demo');
      expect(render(bare)).not.toContain('Watch the demo');
      expect(render()).not.toContain('Watch the demo');
    });
  });
});
