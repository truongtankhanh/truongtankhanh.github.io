import { renderToString } from 'react-dom/server';
import { Page } from './Page';
import { resume } from './content/resume';
import { headTags, pageMeta, robotsTxt, sitemapXml } from './lib/seo';
import { routes, type Route } from './routes';

/** Every page to write into `dist/`: the same list the sitemap reads. */
export function pages(): Route[] {
  return routes(resume);
}

/** The markup of the page at `path` and the tags for its head. `scripts/prerender.js` writes both into `dist/`. */
export function render(path = '/'): { html: string; head: string } {
  return { html: renderToString(<Page path={path} />), head: headTags(resume, pageMeta(resume, path)) };
}

/** The CV PDF of this build: its URL and file name, and whether the build found the file (`vite.config.ts`). */
export function cvFile(): { pdf: string; fileName: string; published: boolean } {
  const { pdf, fileName, published } = resume.cv;
  return { pdf, fileName, published };
}

/** Files that sit next to `index.html` in `dist/`. */
export function seoFiles(lastmod: string): Record<string, string> {
  return { 'sitemap.xml': sitemapXml(resume, lastmod), 'robots.txt': robotsTxt(resume) };
}
