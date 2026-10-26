import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { resume } from '../content/resume';
import { formatRange } from '../lib/dates';
import { stripEmphasis } from '../lib/emphasis';
import { findPhoneNumber } from '../lib/privacy';
import { displayUrl } from '../lib/urls';
import { PrintCv } from './PrintCv';

/** React separates adjacent text nodes with `<!-- -->`; drop them so the text reads as written. */
const html = (r = resume) => renderToString(<PrintCv resume={r} />).replaceAll('<!-- -->', '');

const entities: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
};

/** What a reader sees: the text of the page without tags, the footer style or the drawings. */
function textOf(markup: string): string {
  return markup
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<\/?strong>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:amp|lt|gt|quot|#x27);/g, (e) => entities[e]!)
    .replace(/\s+/g, ' ')
    .trim();
}

const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

describe('PrintCv', () => {
  it('has one h1, the name, and the sections of the Word edition in order', () => {
    const markup = html();
    expect(markup.match(/<h1[ >]/g)).toHaveLength(1);
    expect(markup).toMatch(/<h1 [^>]*lang="vi"[^>]*>Trương Tấn Khánh<\/h1>/);
    const headings = [...markup.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map((m) => m[1]);
    expect(headings).toEqual([
      'Summary',
      'Technical Skills',
      'Experience',
      'Public work',
      'How I work',
      'Education and languages',
    ]);
  });

  it('links back to the site', () => {
    expect(html()).toMatch(/<nav [^>]*class="cv-bar"[^>]*><a href="\/">/);
  });

  it('offers the PDF in the bar only when the build shipped it, since the PDF is printed from a build without it', () => {
    expect(html()).not.toContain('Download CV');
    const bar = html({ ...resume, cv: { ...resume.cv, published: true, bytes: 184_320 } }).match(
      /<nav [^>]*class="cv-bar"[^>]*>(.*?)<\/nav>/,
    )?.[1];
    expect(bar).toContain(`href="${resume.cv.pdf}" download="${resume.cv.fileName}"`);
    expect(bar).toContain('aria-label="Download CV, PDF, 180 KB"');
  });

  it('opens with the band: location, name with the monogram, role and two contact lines, and no phone number', () => {
    const markup = html();
    const band = markup.match(/<header class="cv-head">([\s\S]*?)<\/header>/)?.[1] ?? '';
    const text = textOf(band);
    expect(text.startsWith(`${resume.location} · ${resume.timezone} ${resume.name} ${resume.headline}`)).toBe(
      true,
    );
    expect(band).toContain('class="cv-mark"');
    const lines = [...band.matchAll(/<ul class="cv-links"[^>]*>(.*?)<\/ul>/g)].map((m) => m[1]!);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain(`href="mailto:${resume.email}"`);
    expect(lines[0]).toContain(`>${displayUrl(resume.siteUrl)}</a>`);
    expect(lines[1]).toContain(`>${displayUrl(resume.links.github)}</a>`);
    expect(lines[1]).toContain(`>${displayUrl(resume.links.linkedin)}</a>`);
    expect(findPhoneNumber(textOf(markup))).toBeUndefined();
    expect(markup).not.toContain('tel:');
  });

  it('shows the five career figures as one strip in their short words, and then the summary', () => {
    const markup = html();
    const strip = markup.match(/<ul class="cv-figures"[^>]*>([\s\S]*?)<\/ul>/)?.[1] ?? '';
    expect(resume.metrics).toHaveLength(5);
    expect(textOf(strip)).toBe(resume.metrics.map((m) => `${m.value} ${m.short ?? m.label}`).join(' '));
    expect(strip.match(/class="cv-figure"/g)).toHaveLength(resume.metrics.length);
    expect(markup.indexOf('cv-figures')).toBeLessThan(markup.indexOf('cv-summary'));
    for (const paragraph of resume.intro) expect(textOf(markup)).toContain(paragraph);
  });

  it('has a row for each skill group: the group in a label column and its items as one line', () => {
    const markup = html();
    const rows = markup.match(/<section aria-labelledby="cv-skills">[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(resume.skills).toHaveLength(5);
    for (const group of resume.skills) {
      expect(rows, group.name).toContain(`<dt>${group.name}</dt><dd>${group.items.join(', ')}</dd>`);
    }
    expect(markup).not.toContain('cv-chip');
  });

  it('lists every role, newest first, with its dates and title', () => {
    const markup = html();
    const list = markup.match(/<ol class="cv-roles">([\s\S]*?)<\/ol>/)?.[1] ?? '';
    const at = resume.experience.map((role) => {
      expect(list, role.company).toContain(`<h3>${role.company}</h3>`);
      expect(list, role.company).toContain(`<p class="cv-when">${formatRange(role.start, role.end)}</p>`);
      expect(list, role.company).toContain(`<p class="cv-role-title">${role.title}</p>`);
      return list.indexOf(`<h3>${role.company}</h3>`);
    });
    expect(at).toEqual([...at].sort((a, b) => a - b));
    expect(markup).not.toContain('cv-badge');
  });

  it('runs the name of an engagement into its context in bold, and prints every bullet with its key phrase in strong ink', () => {
    const markup = html();
    expect(markup).not.toContain('**');
    expect(markup).toContain('<strong>two apps and nine shared packages</strong>');
    const text = textOf(markup);
    for (const role of resume.experience)
      for (const w of role.work) {
        if (w.name && w.context) expect(text).toContain(`${w.name}. ${w.context}`);
        for (const point of w.points) expect(text, point).toContain(stripEmphasis(point));
      }
  });

  it('lets a role of several engagements break between them, and keeps a short role whole', () => {
    const list = html().match(/<ol class="cv-roles">([\s\S]*?)<\/ol>/)?.[1] ?? '';
    const classes = [...list.matchAll(/<li class="(cv-role[^"]*)"/g)].map((m) => m[1]);
    expect(classes).toHaveLength(resume.experience.length);
    resume.experience.forEach((role, i) => {
      expect(classes[i]?.includes('is-long'), role.company).toBe(role.work.length > 1);
    });
  });

  it('gives each public repository two lines: its name with the lead figure, then its address as a link', () => {
    const markup = html();
    const rows = markup.match(/<li class="cv-work">[\s\S]*?<\/li>/g) ?? [];
    expect(rows).toHaveLength(5);
    resume.projects.forEach((project, i) => {
      const row = textOf(rows[i]!);
      const figure = project.stat ?? project.caseStudy?.does.lead.figure;
      expect(figure, project.name).toBeDefined();
      expect(row, project.name).toBe(
        `${project.name} · ${figure!.value} – ${figure!.label} ${displayUrl(project.repo)}`,
      );
      expect(rows[i], project.name).toContain(`href="${project.repo}"`);
    });
  });

  it('has the four principles as one paragraph each, education and both languages', () => {
    const markup = html();
    const text = textOf(markup);
    expect(resume.principles).toHaveLength(4);
    for (const p of resume.principles) expect(text).toContain(`${p.title}. ${p.body}`);
    const { education } = resume;
    expect(text).toContain(
      `Education ${education.school}, ${education.detail} (${education.start}–${education.end})`,
    );
    for (const l of resume.languages) {
      expect(text).toContain(`${l.name} · ${l.level}${l.detail ? `. ${l.detail}` : ''}`);
    }
  });

  it('leaves out what the Word edition leaves out: the core stack, the scope card, the evidence and the contact box', () => {
    const text = textOf(html());
    for (const left of ['Core stack', 'What I own', 'In practice', 'Let’s talk', 'Current']) {
      expect(text, left).not.toContain(left);
    }
    for (const own of resume.leadership.owns) expect(text).not.toContain(own);
    expect(html()).not.toContain('cv-close');
  });

  it('breaks only before nothing by class, so the page count follows the content', () => {
    expect(html().match(/break-before|page-break/g)).toBeNull();
  });

  it('writes the name and role into the footer of every page, from the content', () => {
    const style = html().match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
    expect(style).toBe('@page cv{@bottom-left{content:"Trương Tấn Khánh · Full-stack Engineer"}}');
  });

  it('escapes the footer words, so a quote or a closing tag in the content cannot break out of the style', () => {
    const markup = html({ ...resume, name: 'A"B</style><b>C\\', headline: 'D\nE' });
    const style = markup.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
    expect(style).toContain('content:"A\\22 B\\3c /style>');
    expect(style).not.toContain('</style');
    expect(style).toContain('\\5c ');
    expect(style).toContain('D\\a E');
  });

  it('says nothing the content file does not say: every word is the content’s or a heading or label', () => {
    const labels =
      'Summary Technical Skills Experience Public work How I work Education and languages Languages Back to the site Career at a glance Contact Profiles Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec present';
    const known = new Set([...words(JSON.stringify(resume).replaceAll('**', '')), ...words(labels)]);
    const unknown = [...new Set(words(textOf(html())))].filter((word) => !known.has(word));
    expect(unknown).toEqual([]);
  });
});
