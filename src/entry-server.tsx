import { renderToString } from 'react-dom/server';
import { App } from './App';
import { resume } from './content/resume';
import { jsonLdScript, personJsonLd, robotsTxt, sitemapXml } from './lib/seo';

export function render(): string {
  return renderToString(<App />);
}

/** Extra tags for the head, written into `dist/index.html` by `scripts/prerender.js`. */
export function renderHead(): string {
  return jsonLdScript(personJsonLd(resume));
}

/** Files that sit next to `index.html` in `dist/`. */
export function seoFiles(lastmod: string): Record<string, string> {
  return { 'sitemap.xml': sitemapXml(resume, lastmod), 'robots.txt': robotsTxt(resume) };
}
