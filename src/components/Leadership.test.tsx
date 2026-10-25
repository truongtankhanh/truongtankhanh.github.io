import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { resume } from '../content/resume';
import { Leadership } from './Leadership';

const render = () =>
  // React separates adjacent text nodes with `<!-- -->`; drop them so the text reads as written.
  renderToString(
    <Leadership
      leadership={resume.leadership}
      principles={resume.principles}
      education={resume.education}
      languages={resume.languages}
    />,
  ).replaceAll('<!-- -->', '');

/** The part of the markup before the plain list that the printed CV uses. */
const screen = () => render().split('<dl class="print-only')[0]!;

describe('Leadership', () => {
  it('is the "How I work" section, labelled by its heading', () => {
    const markup = render();
    expect(markup).toContain('<section id="approach" class="section" aria-labelledby="approach-title">');
    expect(markup).toContain('<h2 id="approach-title">How I work</h2>');
  });

  it('shows the scope: the two figures and what I own, all from the content', () => {
    const markup = screen();
    expect(markup).toContain('aria-label="Scope of leadership"');
    for (const f of resume.leadership.figures) {
      expect(markup).toContain(
        `<span class="lead-value">${f.value}</span><span class="lead-label">${f.label}</span>`,
      );
    }
    expect(markup).toContain('What I own');
    for (const own of resume.leadership.owns) expect(markup).toContain(`<li>${own}</li>`);
  });

  it('draws each principle as an article with its statement and its quoted evidence with the source', () => {
    const cards = screen().split('<article ').slice(1);
    expect(cards).toHaveLength(resume.principles.length);
    resume.principles.forEach((p, i) => {
      const card = cards[i]!;
      expect(card).toContain(`<h3>${p.title}</h3>`);
      expect(card).toContain(`<p class="principle-body">${p.body}</p>`);
      expect(card).toContain('In practice');
      for (const e of p.evidence) expect(card).toContain(`<q>${e.text}</q><cite>${e.source}</cite>`);
    });
  });

  it('gives education and each language a label, a main line and, where there is one, a muted detail', () => {
    const markup = screen();
    const { education, languages } = resume;
    expect(markup).toContain(`<dt>Education</dt><dd class="fact-main">${education.school}</dd>`);
    expect(markup).toContain(
      `<dd class="fact-sub">${education.detail} (${education.start}–${education.end})</dd>`,
    );
    for (const l of languages) {
      expect(markup).toContain(`<dt>${l.name}</dt><dd class="fact-main">${l.level}</dd>`);
      if (l.detail) expect(markup).toContain(`<dd class="fact-sub">${l.detail}</dd>`);
    }
  });

  it('keeps the plain list of education and languages that the printed CV uses', () => {
    const markup = render();
    expect(markup).toContain('<dl class="print-only facts">');
    const { education } = resume;
    expect(markup).toContain(
      `${education.school}, ${education.detail} (${education.start}–${education.end})`,
    );
  });
});
