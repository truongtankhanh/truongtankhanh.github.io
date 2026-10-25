import type { Project, Resume } from '../content/types';
import { NOT_FOUND_PATH, routes, type Route } from '../routes';

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

/** What the head of one page says about it. Pages with `noindex` get `robots` and no canonical or `og:url`. */
export interface PageMeta {
  title: string;
  description: string;
  /** Defaults to `description`. */
  shareDescription?: string;
  /** Root-relative path of the page, such as `/` or `/work/ops-command-center/`. */
  path: string;
  type: 'profile' | 'article' | 'website';
  noindex?: boolean;
  image: { path: string; alt: string };
  jsonLd?: object[];
}

const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };

/** The home page keeps its title and descriptions; they carry the "open to remote full-stack work" line. */
export function homeMeta(resume: Resume): PageMeta {
  const title = `${resume.name}, ${resume.headline}`;
  return {
    title,
    description:
      'Full-stack engineer in Vietnam (UTC+7): system design, NestJS, React, Angular, IoT and AWS. Open to remote full-stack work.',
    shareDescription:
      'Operations platforms, IoT and live video, from system design to production. Open to remote full-stack work.',
    path: '/',
    type: 'profile',
    image: {
      path: 'images/og.png',
      alt: `${title}. Operations platforms, IoT and live video, from architecture to production.`,
    },
    jsonLd: [personJsonLd(resume)],
  };
}

/** The 404 page: no canonical, because the server already answers 404, and no claim about the owner. */
export function notFoundMeta(resume: Resume): PageMeta {
  const title = `Page not found, ${resume.name}`;
  return {
    title,
    description: 'The link may be old or mistyped. Everything on this site is on the home page.',
    path: NOT_FOUND_PATH,
    type: 'website',
    noindex: true,
    image: { path: 'images/og.png', alt: `${resume.name}, ${resume.headline}.` },
  };
}

/** A case-study page: its own title and canonical, and the lead of the case study as the description. */
export function caseStudyMeta(resume: Resume, project: Project): PageMeta {
  const study = project.caseStudy;
  if (!study) throw new Error(`${project.name} has no case study`);
  const title = `${project.name} case study, ${resume.name}`;
  return {
    title,
    description: study.lead,
    path: `/work/${study.slug}/`,
    type: 'article',
    image: { path: 'images/og.png', alt: `${resume.name}, ${resume.headline}.` },
  };
}

/** The page served at `path`. The CV page arrives with Phase 4. */
export function pageMeta(resume: Resume, path: string): PageMeta {
  if (path === '/') return homeMeta(resume);
  if (path === NOT_FOUND_PATH) return notFoundMeta(resume);
  const project = resume.projects.find((p) => p.caseStudy && `/work/${p.caseStudy.slug}/` === path);
  if (project) return caseStudyMeta(resume, project);
  throw new Error(`No page at ${path}`);
}

function attr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** The tags that differ from page to page, for the `<!--app-head-->` marker of `index.html`. */
export function headTags(resume: Resume, page: PageMeta): string {
  const url = new URL(page.path.replace(/^\//, ''), resume.siteUrl).href;
  const image = new URL(page.image.path, resume.siteUrl).href;
  const shareDescription = page.shareDescription ?? page.description;
  const tags = [
    `<title>${attr(page.title)}</title>`,
    `<meta name="description" content="${attr(page.description)}" />`,
    ...(page.noindex
      ? ['<meta name="robots" content="noindex" />']
      : [`<link rel="canonical" href="${attr(url)}" />`]),
    `<meta property="og:type" content="${page.type}" />`,
    `<meta property="og:title" content="${attr(page.title)}" />`,
    `<meta property="og:description" content="${attr(shareDescription)}" />`,
    ...(page.noindex ? [] : [`<meta property="og:url" content="${attr(url)}" />`]),
    `<meta property="og:image" content="${attr(image)}" />`,
    `<meta property="og:image:width" content="${SHARE_IMAGE_SIZE.width}" />`,
    `<meta property="og:image:height" content="${SHARE_IMAGE_SIZE.height}" />`,
    `<meta property="og:image:alt" content="${attr(page.image.alt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    ...(page.jsonLd ?? []).map(jsonLdScript),
  ];
  return tags.join('\n    ');
}

/** The indexable routes as absolute URLs. `noindex` routes stay out, because a sitemap only lists what should be found. */
export function sitemapXml(resume: Resume, lastmod: string, list: Route[] = routes(resume)): string {
  const urls = list
    .filter((route) => !route.noindex)
    .map(
      (route) => `  <url>
    <loc>${new URL(route.path.replace(/^\//, ''), resume.siteUrl).href}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}</urlset>
`;
}

export function robotsTxt(resume: Resume): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${resume.siteUrl}sitemap.xml\n`;
}
