import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { sampleCaseStudy } from '../content/caseStudyFixture';
import { resume } from '../content/resume';
import type { Project, Resume } from '../content/types';
import { CaseStudy } from './CaseStudy';

const [first, second, ...others] = resume.projects as [Project, Project, ...Project[]];
const withStudy = (project: Project, slug: string): Project => ({
  ...project,
  caseStudy: sampleCaseStudy(slug),
});
const project = withStudy(first, 'ops-command-center');
const study = project.caseStudy!;
const one: Resume = { ...resume, projects: [project, second, ...others] };
const two: Resume = { ...one, projects: [project, withStudy(second, 'iot-telemetry-pipeline'), ...others] };

/** React separates adjacent text nodes with `<!-- -->`; drop them so the text reads as written. */
const html = (r = one, p = project) =>
  renderToString(<CaseStudy resume={r} project={p} />).replaceAll('<!-- -->', '');

/** The markup of the first element that starts with `open`, up to and including its closing `tag`. */
function block(markup: string, open: string, tag: string) {
  const start = markup.indexOf(open);
  return markup.slice(start, markup.indexOf(`</${tag}>`, start) + tag.length + 3);
}

describe('CaseStudy', () => {
  it('has one h1, the project name, and headings that nest', () => {
    const markup = html();
    expect(markup.match(/<h1[ >]/g)).toHaveLength(1);
    expect(markup).toMatch(new RegExp(`<h1 [^>]*>${project.name}</h1>`));
    const levels = [...markup.matchAll(/<h([1-4])[ >]/g)].map((m) => Number(m[1]));
    expect(levels[0]).toBe(1);
    levels.forEach((level, i) => {
      if (i > 0) expect(level - levels[i - 1]!, `heading ${i}`).toBeLessThanOrEqual(1);
    });
    expect([...markup.matchAll(/<h2 [^>]*>([^<]+)<\/h2>/g)].map((m) => m[1])).toEqual([
      'Overview',
      'What it does',
      'Decisions that shaped it',
      'How to check it',
      'Run it',
    ]);
  });

  it('keeps the header and marks Work as the tab this page belongs to', () => {
    const markup = html();
    expect(markup).toContain('<header class="site-header">');
    expect(markup).toMatch(/<a [^>]*href="\/#work"[^>]*aria-current="location"[^>]*>Work<\/a>/);
    expect(markup).toMatch(/<a [^>]*class="site-name"[^>]*href="\/"/);
  });

  it('shows a breadcrumb back to the work section, ending on the project', () => {
    const crumbs = block(html(), '<ol class="cs-crumbs">', 'ol');
    expect(crumbs).toContain('<a href="/#work">Work</a>');
    expect(crumbs).toContain(`<li aria-current="page">${project.name}</li>`);
  });

  it('labels the head "Case study" and gives the lead and two buttons', () => {
    const markup = html();
    expect(markup).toContain('<p class="hero-meta">Case study</p>');
    expect(markup).toContain(study.lead);
    const cta = block(markup, '<div class="cs-cta">', 'div');
    expect(cta).toMatch(new RegExp(`<a [^>]*href="${project.repo}"[^>]*>Open the repository<svg`));
    expect(cta).toMatch(/<a [^>]*href="#run"[^>]*>Run it yourself<\/a>/);
  });

  it('lists role, stack, status and source as four facts', () => {
    const facts = block(html(), '<dl class="cs-facts">', 'dl');
    expect([...facts.matchAll(/<dt [^>]*>([^<]+)<\/dt>/g)].map((m) => m[1])).toEqual([
      'Role',
      'Stack',
      'Status',
      'Source',
    ]);
    expect(facts).toContain(study.role);
    expect(facts).toContain(project.stack.join(' · '));
    expect(facts).toContain(study.status);
    expect(facts).toContain(
      `<a href="${project.repo}">ops-command-center</a><small>github.com/truongtankhanh</small>`,
    );
  });

  it('offers a contents list whose links all land on a section that takes focus', () => {
    const markup = html();
    const toc = block(markup, '<nav class="cs-toc"', 'nav');
    const links = [...toc.matchAll(/<a href="#([^"]+)"[^>]*>([^<]+)<\/a>/g)];
    expect(links.map((m) => m[2])).toEqual([
      'Overview',
      'What it does',
      'Decisions',
      'How to check it',
      'Run it',
    ]);
    for (const [, id] of links) expect(markup).toMatch(new RegExp(`<section id="${id}"[^>]*tabindex="-1"`));
    expect(markup).toContain('On this page');
  });

  it('marks the first section as current before any scrolling', () => {
    const toc = block(html(), '<nav class="cs-toc"', 'nav');
    expect(toc.match(/aria-current="location"/g)).toHaveLength(1);
    expect(toc).toMatch(/<a href="#overview" aria-current="location">/);
  });

  it('shows the overview screenshot with its caption and the overview paragraphs', () => {
    const markup = html();
    expect(markup).toContain(`src="/${project.image!.src}"`);
    expect(markup).toContain(`alt="${project.image!.alt}"`);
    expect(markup).toContain('width="1600"');
    expect(markup).toContain(project.image!.caption);
    for (const paragraph of study.overview) expect(markup).toContain(`<p>${paragraph}</p>`);
  });

  it('leads "What it does" with the key figure, then three cards, with key phrases in strong', () => {
    const markup = html();
    const card = block(markup, '<article class="cs-lead-card', 'article');
    expect(card).toContain('<b>1 s</b>');
    expect(card).toContain('<strong>within a second</strong>');
    expect(card).toContain(study.does.lead.image!.caption);
    const cards = markup.match(/<article class="cs-card plate">/g);
    expect(cards).toHaveLength(3);
    expect(markup).toContain('<strong>key phrase two</strong>');
    expect(markup).not.toContain('**');
  });

  it('lets the lead card take one column when it has no screenshot', () => {
    const solo = {
      ...project,
      caseStudy: { ...study, does: { ...study.does, lead: { ...study.does.lead } } },
    };
    delete solo.caseStudy.does.lead.image;
    expect(html(one, solo)).toContain('<article class="cs-lead-card cs-lead-card-solo plate-dark">');
    expect(html()).toContain('<article class="cs-lead-card plate-dark">');
  });

  it('lists each decision with its id, real title and one line', () => {
    const list = block(html(), '<ul class="cs-decisions">', 'ul');
    for (const d of study.decisions) {
      expect(list).toContain(`<b>${d.id}</b>`);
      expect(list).toContain(`<strong>${d.title}.</strong> ${d.why}`);
    }
  });

  it('puts the commands in a focusable block that scrolls inside its box', () => {
    const markup = html();
    expect(markup).toMatch(
      /<pre class="cs-code" tabindex="0"><code>pnpm start\n# App  http:\/\/localhost:1<\/code><\/pre>/,
    );
    expect(markup).toContain(`<p>${study.run.intro}</p>`);
    const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.cs-code \{[^}]*overflow-x: auto/);
  });

  it('links the previous and next case study, and only to pages that exist', () => {
    const alone = block(html(), '<nav class="cs-pager"', 'nav');
    expect(alone).toContain('<a href="/#work">');
    expect(alone).toContain('Back to all work');
    expect(alone).not.toContain('Next');

    const pager = block(html(two, project), '<nav class="cs-pager"', 'nav');
    expect(pager).toContain('<a href="/work/iot-telemetry-pipeline/">');
    expect(pager).toContain(second.name);

    const last = withStudy(second, 'iot-telemetry-pipeline');
    const back = block(html(two, last), '<nav class="cs-pager"', 'nav');
    expect(back).toContain('<a href="/work/ops-command-center/">');
    expect(back).toContain(project.name);
    expect(back).not.toContain('Next');
  });

  it('has no relative URL, because the page sits one folder down', () => {
    expect(html().match(/\s(?:href|src)="(?![/#]|[a-z][a-z0-9+.-]*:)[^"]*"/gi)).toBeNull();
  });

  it('refuses a project without a case study', () => {
    expect(() => html(one, second)).toThrow(/no case study/);
  });
});
