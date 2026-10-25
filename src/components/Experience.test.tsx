import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { resume } from '../content/resume';
import { emphasis, stripEmphasis } from '../lib/emphasis';
import { Experience } from './Experience';

const render = (roles = resume.experience) =>
  // React separates adjacent text nodes with `<!-- -->`; drop them so the text reads as written.
  renderToString(<Experience roles={roles} />).replaceAll('<!-- -->', '');

/** The text of some markup: tags dropped, the few entities React writes turned back into characters. */
const text = (markup: string) =>
  markup
    .replace(/<[^>]+>/g, '')
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&');

const roleBlocks = (markup: string) => markup.split('<li class="role').slice(1);

describe('Experience', () => {
  it('is the experience section, labelled by its heading', () => {
    const markup = render();
    expect(markup).toContain('<section id="experience" class="section" aria-labelledby="experience-title">');
    expect(markup).toContain('<h2 id="experience-title">Experience</h2>');
  });

  it('lists the roles in the order of the content, which is newest first', () => {
    const blocks = roleBlocks(render());
    expect(blocks).toHaveLength(resume.experience.length);
    resume.experience.forEach((role, i) => expect(blocks[i]).toContain(`<h3>${role.company}<span`));
  });

  it('marks only the open role as current, with a badge', () => {
    const blocks = roleBlocks(render());
    resume.experience.forEach((role, i) => {
      const current = !role.end;
      expect(blocks[i]!.startsWith(' is-current"'), role.company).toBe(current);
      expect(blocks[i]!.includes('Current</p>'), role.company).toBe(current);
    });
    expect(render().match(/class="role-badge"/g)).toHaveLength(1);
  });

  it('gives every time element a valid month as its dateTime', () => {
    const times = [...render().matchAll(/<time dateTime="([^"]*)">/g)].map((m) => m[1]!);
    const expected = resume.experience.flatMap((r) => (r.end ? [r.start, r.end] : [r.start]));
    expect(times).toEqual(expected);
    for (const t of times) expect(t).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });

  it('hides the rail from assistive technology, one per role', () => {
    const rails = render().match(/<div class="role-rail" aria-hidden="true">/g);
    expect(rails).toHaveLength(resume.experience.length);
  });

  it('keeps every bullet word for word, with only the key phrase in strong', () => {
    const markup = render();
    const points = resume.experience.flatMap((r) => r.work.flatMap((w) => w.points));
    expect(points.length).toBeGreaterThan(10);
    for (const point of points) {
      expect(text(markup), point).toContain(stripEmphasis(point));
      for (const part of emphasis(point).filter((p) => p.strong)) {
        expect(markup.replaceAll('&#x27;', "'").replaceAll('&amp;', '&'), part.text).toContain(
          `<strong>${part.text}</strong>`,
        );
      }
    }
  });

  it('draws a named engagement as a box and one without a name as a flat list', () => {
    const markup = render();
    const all = resume.experience.flatMap((r) => r.work);
    expect(markup.match(/<div class="engagement">/g)).toHaveLength(all.filter((w) => w.name).length);
    expect(markup.match(/<div class="engagement is-flat">/g)).toHaveLength(all.filter((w) => !w.name).length);
    for (const w of all) if (w.name) expect(markup).toContain(`<h4>${w.name}</h4>`);
  });

  it('keeps the links of the engagements that have one', () => {
    const markup = render();
    for (const w of resume.experience.flatMap((r) => r.work)) {
      if (w.link)
        expect(markup).toContain(`<a class="engagement-link" href="${w.link.href}">${w.link.label}</a>`);
    }
  });
});
