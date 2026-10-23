import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resume } from '../content/resume';
import { routes } from '../routes';
import { findPhoneNumber } from './privacy';
import { headTags, homeMeta, jsonLdScript, pageMeta, personJsonLd, robotsTxt, sitemapXml } from './seo';

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
    expect(findPhoneNumber(tag)).toBeUndefined();
    const json = tag.slice(tag.indexOf('>') + 1, tag.lastIndexOf('</script>'));
    expect(json).not.toContain('<');
    expect(JSON.parse(json).name).toBe(resume.name);
  });

  it('lists the public facts and nothing else: no phone, no address beyond the country', () => {
    expect(Object.keys(data).sort()).toEqual(
      [
        '@context',
        '@type',
        'name',
        'alternateName',
        'jobTitle',
        'url',
        'email',
        'address',
        'sameAs',
        'knowsAbout',
        'worksFor',
      ].sort(),
    );
    expect(data.url).toBe(resume.siteUrl);
    expect(data.email).toBe(`mailto:${resume.email}`);
    expect(data.address).toEqual({ '@type': 'PostalAddress', addressCountry: 'VN' });
  });

  it('knows about every core technology', () => {
    for (const tech of resume.coreStack) expect(data.knowsAbout).toContain(tech);
  });

  it('passes the privacy check as part of the whole home page head', () => {
    expect(findPhoneNumber(headTags(resume, homeMeta(resume)))).toBeUndefined();
  });
});

describe('sitemap and robots', () => {
  const origin = 'https://truongtankhanh.github.io';
  const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);

  it('uses absolute URLs on the site origin', () => {
    expect(resume.siteUrl).toBe(`${origin}/`);
    const xml = sitemapXml(resume, '2026-10-23');
    expect(locs(xml)).toEqual([`${origin}/`]);
    expect(xml).toContain('<lastmod>2026-10-23</lastmod>');
    expect(robotsTxt(resume)).toContain(`Sitemap: ${origin}/sitemap.xml`);
  });

  it('lists the home page now and each case study once it exists, from the route list', () => {
    const withStudy = {
      ...resume,
      projects: resume.projects.map((p, i) =>
        i === 0 ? { ...p, caseStudy: { slug: 'ops-command-center', lead: 'L', role: 'R', status: 'S' } } : p,
      ),
    };
    expect(routes(withStudy).map((r) => r.path)).toEqual(['/', '/work/ops-command-center/']);
    expect(locs(sitemapXml(withStudy, '2026-10-23'))).toEqual([
      `${origin}/`,
      `${origin}/work/ops-command-center/`,
    ]);
  });

  it('leaves noindex pages (the CV page and the 404 page) out', () => {
    const list = [{ path: '/' }, { path: '/cv/', noindex: true }, { path: '/404.html', noindex: true }];
    const found = locs(sitemapXml(resume, '2026-10-23', list));
    expect(found).toEqual([`${origin}/`]);
  });

  it('allows every crawler in robots.txt and blocks nothing, so a noindex tag can be read', () => {
    const txt = robotsTxt(resume);
    expect(txt).toMatch(/^User-agent: \*$/m);
    expect(txt).toMatch(/^Allow: \/$/m);
    expect(txt).not.toMatch(/^Disallow:/m);
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

describe('page head', () => {
  const count = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length;
  const home = headTags(resume, homeMeta(resume));

  it('gives the home page one title, one canonical and matching Open Graph tags', () => {
    expect(count(home, /<title>/g)).toBe(1);
    expect(home).toContain(`<title>${resume.name}, ${resume.headline}</title>`);
    expect(count(home, /rel="canonical"/g)).toBe(1);
    expect(home).toContain(`<link rel="canonical" href="${resume.siteUrl}" />`);
    expect(home).toContain(`<meta property="og:url" content="${resume.siteUrl}" />`);
    expect(home).toContain(`<meta property="og:title" content="${resume.name}, ${resume.headline}" />`);
    expect(home).not.toContain('name="robots"');
  });

  it('describes the home page and keeps the open-to-work line in both descriptions', () => {
    const meta = homeMeta(resume);
    expect(meta.description).toContain('Open to remote full-stack work');
    expect(meta.shareDescription).toContain('Open to remote full-stack work');
    expect(home).toContain(`<meta name="description" content="${meta.description}" />`);
    expect(home).toContain(`<meta property="og:description" content="${meta.shareDescription}" />`);
  });

  it('points the share image at an absolute URL and states its size, alt text and card type', () => {
    expect(home).toContain(`<meta property="og:image" content="${resume.siteUrl}images/og.png" />`);
    expect(home).toContain('<meta property="og:image:width" content="1200" />');
    expect(home).toContain('<meta property="og:image:height" content="630" />');
    expect(home).toMatch(/<meta property="og:image:alt" content="[^"]{20,}" \/>/);
    expect(home).toContain('<meta name="twitter:card" content="summary_large_image" />');
  });

  it('embeds the person JSON-LD', () => {
    expect(count(home, /<script type="application\/ld\+json">/g)).toBe(1);
  });

  it('gives a noindex page a robots tag and neither a canonical nor an og:url', () => {
    const tags = headTags(resume, {
      title: 'Page not found',
      description: 'Not here.',
      path: '/404.html',
      type: 'website',
      noindex: true,
      image: { path: 'images/og.png', alt: 'Share image' },
    });
    expect(tags).toContain('<meta name="robots" content="noindex" />');
    expect(tags).not.toContain('rel="canonical"');
    expect(tags).not.toContain('og:url');
    expect(count(tags, /<title>/g)).toBe(1);
  });

  it('escapes quotes and angle brackets in a title', () => {
    const tags = headTags(resume, { ...homeMeta(resume), title: 'A "B" <C> & D', jsonLd: [] });
    expect(tags).toContain('<title>A &quot;B&quot; &lt;C&gt; &amp; D</title>');
  });

  it('has a page for the home path only, for now', () => {
    expect(pageMeta(resume, '/').path).toBe('/');
    expect(() => pageMeta(resume, '/nowhere/')).toThrow(/No page/);
  });

  it('leaves the per-page tags out of index.html and keeps both markers', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
    expect(html).toContain('<!--app-head-->');
    expect(html).toContain('<!--app-html-->');
    for (const tag of ['rel="canonical"', 'property="og:', 'name="description"', 'name="twitter:card"']) {
      expect(html).not.toContain(tag);
    }
  });
});
