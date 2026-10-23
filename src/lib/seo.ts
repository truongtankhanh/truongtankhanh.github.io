import type { Resume } from '../content/types';

/** Skill items without the parenthetical detail: "AWS (ECS, CDK)" becomes "AWS". */
function skillNames(resume: Resume): string[] {
  const names = resume.skills.flatMap((g) => g.items.map((i) => i.replace(/\s*\(.*\)$/, '')));
  return [...new Set(names)];
}

/** schema.org Person for the home page. Public facts only: no phone number, country but no street. */
export function personJsonLd(resume: Resume) {
  const current = resume.experience.find((r) => !r.end);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: resume.name,
    alternateName: resume.nameAscii,
    jobTitle: resume.headline,
    url: resume.siteUrl,
    email: `mailto:${resume.email}`,
    address: { '@type': 'PostalAddress', addressCountry: 'VN' },
    sameAs: [resume.links.github, resume.links.linkedin],
    knowsAbout: skillNames(resume),
    ...(current && { worksFor: { '@type': 'Organization', name: current.company } }),
  };
}

/** The `<script>` tag for the head. `<` is escaped so no field can close the tag early. */
export function jsonLdScript(data: object): string {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

export function sitemapXml(resume: Resume, lastmod: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${resume.siteUrl}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
</urlset>
`;
}

export function robotsTxt(resume: Resume): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${resume.siteUrl}sitemap.xml\n`;
}
