import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { resume } from '../content/resume';
import { ArchDiagram } from './ArchDiagram';

const render = (projects = resume.projects) =>
  // React separates adjacent text nodes with `<!-- -->`; drop them so the text reads as written.
  renderToString(<ArchDiagram architecture={resume.architecture} projects={projects} />).replaceAll(
    '<!-- -->',
    '',
  );

const name = (id: string) => resume.projects.find((p) => p.id === id)!.name;

describe('ArchDiagram', () => {
  it('has a title and a sentence, then an ordered list of boxes and arrows in reading order', () => {
    const markup = render();
    expect(markup).toContain(`<h3>${resume.architecture.title}</h3>`);
    expect(markup).toContain(`<p>${resume.architecture.summary}</p>`);
    const row = markup.slice(markup.indexOf('<ol class="arch-row">'), markup.indexOf('</ol>'));
    const items = [...row.matchAll(/<li class="(arch-(?:node|edge)[^"]*)"/g)].map((m) => m[1]);
    expect(items).toEqual([
      'arch-node',
      'arch-edge',
      'arch-node is-repo',
      'arch-edge',
      'arch-node is-repo',
      'arch-edge',
      'arch-node',
    ]);
    const order = [...row.matchAll(/<b>(.*?)<\/b>|<span>(.*?)<\/span>/g)].map((m) => m[1] ?? m[2]);
    expect(order).toEqual([
      'Sensors',
      resume.architecture.flows[0],
      name('telemetry'),
      resume.architecture.flows[1],
      name('occ'),
      resume.architecture.flows[2],
      'Operators',
    ]);
  });

  it('says "Repository" on the two repository boxes only', () => {
    expect(render().match(/<span class="arch-tag">Repository<\/span>/g)).toHaveLength(2);
  });

  it('hides every arrow from assistive technology and keeps its label as text', () => {
    const markup = render();
    expect(markup.match(/<i aria-hidden="true"><\/i>/g)).toHaveLength(resume.architecture.flows.length);
    for (const label of resume.architecture.flows) expect(markup).toContain(`<span>${label}</span>`);
  });

  it('names the platform under the row, with its services', () => {
    const markup = render();
    expect(markup).toContain('<span class="arch-tag">Runs on</span>');
    expect(markup).toContain(
      `<b>${name('aws')}</b> · ${resume.architecture.platform.services.join(' · ')}, ${resume.architecture.platform.note}`,
    );
  });

  it('fails loudly when it names a project that does not exist, rather than drawing a blank box', () => {
    expect(() => render(resume.projects.filter((p) => p.id !== 'occ'))).toThrow(/"occ"/);
  });
});
