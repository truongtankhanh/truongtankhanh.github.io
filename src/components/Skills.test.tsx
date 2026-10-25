import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { resume } from '../content/resume';
import { Skills } from './Skills';

const render = (groups = resume.skills) =>
  // React separates adjacent text nodes with `<!-- -->`; drop them so the text reads as written.
  renderToString(
    <Skills groups={groups} coreStack={resume.coreStack} coreStackNote={resume.coreStackNote} />,
  ).replaceAll('<!-- -->', '');

/** The cards, without the core band before them. */
const cards = (markup: string) =>
  markup.slice(markup.indexOf('<ul class="skill-grid">')).split('<article ').slice(1);

describe('Skills', () => {
  it('is the skills section, labelled by its heading', () => {
    const markup = render();
    expect(markup).toContain('<section id="skills" class="section" aria-labelledby="skills-title">');
    expect(markup).toContain('<h2 id="skills-title">Skills</h2>');
  });

  it('leads with the core stack, read from the content, in its order, with the CV note', () => {
    const markup = render();
    const band = markup.slice(markup.indexOf('<ul class="core-list"'), markup.indexOf('</ul>'));
    expect(band).toContain('aria-label="Core stack"');
    expect([...band.matchAll(/<li>(.*?)<\/li>/g)].map((m) => m[1])).toEqual(resume.coreStack);
    expect(markup).toContain(`<p class="core-note">${resume.coreStackNote}.</p>`);
  });

  it('names every core tool in the note, and only those among the tools of the skill groups', () => {
    for (const tool of resume.coreStack) expect(resume.coreStackNote).toContain(tool);
    const others = resume.skills.flatMap((g) => g.items).filter((i) => !resume.coreStack.includes(i));
    for (const item of others) expect(resume.coreStackNote, item).not.toContain(item);
  });

  it('has one article with an h3 for each group, in order', () => {
    const list = cards(render());
    expect(list).toHaveLength(resume.skills.length);
    resume.skills.forEach((g, i) => expect(list[i], g.name).toContain(`<h3>${g.name}</h3>`));
  });

  it('lists the chips of each group and where the group was used, as plain text', () => {
    const list = cards(render());
    resume.skills.forEach((g, i) => {
      for (const item of g.items) expect(list[i], item).toContain(`<li class="chip">${item}</li>`);
      expect(list[i]).toContain(`<span class="skill-used-label">Shown in</span> ${g.usedIn.join(', ')}</p>`);
      const used = list[i]!.slice(list[i]!.indexOf('<p class="skill-used">'));
      expect(used, g.name).not.toContain('<a ');
    });
  });
});
