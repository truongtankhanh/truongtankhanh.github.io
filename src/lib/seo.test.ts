import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resume } from '../content/resume';
import { jsonLdScript, personJsonLd, robotsTxt, sitemapXml } from './seo';

describe('person JSON-LD', () => {
  const data = personJsonLd(resume);

  it('describes the person from the content file', () => {
    expect(data['@type']).toBe('Person');
    expect(data.name).toBe(resume.name);
    expect(data.alternateName).toBe(resume.nameAscii);
    expect(data.jobTitle).toBe(resume.headline);
    expect(data.sameAs).toEqual([resume.links.github, resume.links.linkedin]);
    expect(data.worksFor?.name).toBe('Surbana Jurong');
    expect(data.knowsAbout).toContain('NestJS');
    expect(data.knowsAbout).toContain('AWS');
    expect(data.knowsAbout.some((k) => k.includes('('))).toBe(false);
  });

  it('keeps a phone number out and survives being embedded in HTML', () => {
    const tag = jsonLdScript(data);
    expect(tag).toMatch(/^<script type="application\/ld\+json">/);
    expect(tag).not.toMatch(/\b0\d{9}\b|\+84/);
    const json = tag.slice(tag.indexOf('>') + 1, tag.lastIndexOf('</script>'));
    expect(json).not.toContain('<');
    expect(JSON.parse(json).name).toBe(resume.name);
  });
});

describe('sitemap and robots', () => {
  it('uses absolute URLs on the site origin', () => {
    expect(resume.siteUrl).toMatch(/^https:\/\/[\w.-]+\/$/);
    expect(sitemapXml(resume, '2026-10-23')).toContain(`<loc>${resume.siteUrl}</loc>`);
    expect(robotsTxt(resume)).toContain(`Sitemap: ${resume.siteUrl}sitemap.xml`);
  });
});

describe('public CV PDF', () => {
  it('has one file name across the content, the build script and the head', () => {
    expect(readFileSync(new URL('../../scripts/build-pdf.js', import.meta.url), 'utf8')).toContain(
      `'${resume.cvPdf}'`,
    );
    expect(readFileSync(new URL('../../index.html', import.meta.url), 'utf8')).toContain(`/${resume.cvPdf}`);
  });
});
