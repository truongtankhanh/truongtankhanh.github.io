import { renderToString } from 'react-dom/server';
import { App } from './App';
import { resume } from './content/resume';
import { headTags, pageMeta, robotsTxt, sitemapXml } from './lib/seo';

/** The markup of the page at `path` and the tags for its head. `scripts/prerender.js` writes both into `dist/`. */
export function render(path = '/'): { html: string; head: string } {
  return { html: renderToString(<App />), head: headTags(resume, pageMeta(resume, path)) };
}

/** Files that sit next to `index.html` in `dist/`. */
export function seoFiles(lastmod: string): Record<string, string> {
  return { 'sitemap.xml': sitemapXml(resume, lastmod), 'robots.txt': robotsTxt(resume) };
}
