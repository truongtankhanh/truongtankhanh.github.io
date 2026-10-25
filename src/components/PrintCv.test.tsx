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
  it('has one h1, the name, and the sections of frame 05 in order', () => {
    const markup = html();
    expect(markup.match(/<h1[ >]/g)).toHaveLength(1);
    expect(markup).toMatch(/<h1 [^>]*lang="vi"[^>]*>Trương Tấn Khánh<\/h1>/);
    const headings = [...markup.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map((m) => m[1]);
    expect(headings).toEqual([
      'Summary',
      'Experience',
      'Skills',
      'Public work',
      'How I work',
      'Education and languages',
      'Let’s talk',
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

  it('has the contact line of the header: email, site, GitHub and LinkedIn, and no phone number', () => {
    const markup = html();
    const links = markup.match(/<ul class="cv-links"[^>]*>(.*?)<\/ul>/)?.[1] ?? '';
    for (const text of [
      resume.email,
      displayUrl(resume.siteUrl),
      displayUrl(resume.links.github),
      displayUrl(resume.links.linkedin),
    ]) {
      expect(links, text).toContain(`>${text}</a>`);
    }
    expect(links).toContain(`href="mailto:${resume.email}"`);
    expect(findPhoneNumber(textOf(markup))).toBeUndefined();
    expect(markup).not.toContain('tel:');
  });

  it('shows the core stack, the five career figures and the summary', () => {
    const text = textOf(html());
    for (const tool of resume.coreStack) expect(text, tool).toContain(tool);
    expect(resume.metrics).toHaveLength(5);
    for (const m of resume.metrics) expect(text, m.value).toContain(`${m.value} ${m.label}`);
    for (const paragraph of resume.intro) expect(text).toContain(paragraph);
  });

  it('lists every role, newest first, with its dates and title, and marks only the current one', () => {
    const markup = html();
    const list = markup.match(/<ol class="cv-timeline">([\s\S]*?)<\/ol>/)?.[1] ?? '';
    const at = resume.experience.map((role) => {
      expect(list, role.company).toContain(formatRange(role.start, role.end));
      expect(list, role.company).toContain(`${role.company} <small>${role.title}</small>`);
      return list.indexOf(role.company);
    });
    expect(at).toEqual([...at].sort((a, b) => a - b));
    expect(list.match(/class="cv-badge">Current</g)).toHaveLength(
      resume.experience.filter((r) => !r.end).length,
    );
    expect(list.match(/<li class="cv-role is-current/g)).toHaveLength(1);
  });

  it('prints every bullet with its key phrase in strong ink and no stray markers', () => {
    const markup = html();
    expect(markup).not.toContain('**');
    expect(markup).toContain('<strong>two apps and nine shared packages</strong>');
    const text = textOf(markup);
    for (const role of resume.experience)
      for (const w of role.work)
        for (const point of w.points) expect(text, point).toContain(stripEmphasis(point));
  });

  it('lets a role of several engagements break between them, and keeps a short role whole', () => {
    const list = html().match(/<ol class="cv-timeline">([\s\S]*?)<\/ol>/)?.[1] ?? '';
    const classes = [...list.matchAll(/<li class="(cv-role[^"]*)"/g)].map((m) => m[1]);
    expect(classes).toHaveLength(resume.experience.length);
    resume.experience.forEach((role, i) => {
      expect(classes[i]?.includes('is-long'), role.company).toBe(role.work.length > 1);
    });
  });

  it('has a card for each skill group', () => {
    const text = textOf(html());
    expect(resume.skills).toHaveLength(5);
    for (const group of resume.skills) {
      expect(text, group.name).toContain(group.name);
      for (const item of group.items) expect(text, item).toContain(item);
    }
  });

  it('has all five repositories, each leading with one figure, its description, its proof, its stack and its address', () => {
    const markup = html();
    const rows =
      markup.match(
        /<li class="cv-work cv-plate">[\s\S]*?<\/li><\/ul>\s*<p class="cv-label cv-work-repo">[\s\S]*?<\/p>/g,
      ) ?? [];
    expect(rows).toHaveLength(5);
    resume.projects.forEach((project, i) => {
      const row = textOf(rows[i]!);
      const figure = project.stat ?? project.caseStudy?.does.lead.figure;
      expect(figure, project.name).toBeDefined();
      expect(row.startsWith(`${figure!.value} ${figure!.label}`), project.name).toBe(true);
      for (const part of [
        project.name,
        project.what,
        project.proof,
        ...project.stack,
        displayUrl(project.repo),
      ])
        expect(row, project.name).toContain(part);
      expect(rows[i], project.name).toContain(`href="${project.repo}"`);
    });
  });

  it('has the scope, the four principles with their evidence, education and both languages', () => {
    const text = textOf(html());
    for (const f of resume.leadership.figures) expect(text).toContain(`${f.value} ${f.label}`);
    for (const own of resume.leadership.owns) expect(text).toContain(own);
    expect(resume.principles).toHaveLength(4);
    for (const p of resume.principles) {
      expect(text).toContain(p.title);
      expect(text).toContain(p.body);
      for (const e of p.evidence) expect(text).toContain(`${e.text} ${e.source}`);
    }
    const { education } = resume;
    expect(text).toContain(`${education.school} ${education.detail} (${education.start}–${education.end})`);
    for (const l of resume.languages) expect(text).toContain(l.detail ? `${l.level} ${l.detail}` : l.level);
  });

  it('ends with a contact box that follows the content: email, GitHub, LinkedIn and the site', () => {
    const markup = html();
    const box = markup.match(/<section class="cv-close cv-plate"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(box).toContain(`href="mailto:${resume.email}"`);
    for (const url of [resume.links.github, resume.links.linkedin, resume.siteUrl])
      expect(box).toContain(`href="${url}"`);
    expect(markup.lastIndexOf('<section')).toBe(markup.indexOf(box));
  });

  it('breaks only before "Public work" and "How I work" by class, so the page count follows the content', () => {
    const markup = html();
    expect(markup).toContain('<section class="cv-public"');
    expect(markup).toContain('<section class="cv-approach"');
    expect(markup.match(/break-before|page-break/g)).toBeNull();
  });

  it('writes the page footers from the content: name and role on page 1, the site after', () => {
    const style = html().match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
    expect(style).toContain('@page cv:first{@bottom-left{content:"Trương Tấn Khánh · Full-stack Engineer"}}');
    expect(style).toContain(`@page cv{@bottom-left{content:"${displayUrl(resume.siteUrl)}"}}`);
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
      'Core stack Summary Experience Skills Public work How I work What I own In practice Education and languages Let’s talk Email GitHub LinkedIn Website Current Back to the site Career at a glance Contact Scope of leadership Stack Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec present';
    const known = new Set([...words(JSON.stringify(resume).replaceAll('**', '')), ...words(labels)]);
    const unknown = [...new Set(words(textOf(html())))].filter((word) => !known.has(word));
    expect(unknown).toEqual([]);
  });
});
