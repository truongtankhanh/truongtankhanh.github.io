import type { Resume } from './content/types';

export interface Route {
  /** Root-relative, with a trailing slash except for files such as `/404.html`. */
  path: string;
  /** Served but kept out of the sitemap and search results (`/cv/` and the 404 page, when they exist). */
  noindex?: boolean;
}

/** GitHub Pages serves this file, with status 404, for any URL it has no page for. */
export const NOT_FOUND_PATH = '/404.html';

/** Every page the site serves. The sitemap reads this list, so a new case study needs no second edit. */
export function routes(resume: Resume): Route[] {
  return [
    { path: '/' },
    ...resume.projects.flatMap((p) => (p.caseStudy ? [{ path: `/work/${p.caseStudy.slug}/` }] : [])),
    { path: NOT_FOUND_PATH, noindex: true },
  ];
}

/**
 * The route the browser is showing, for hydration: the URL if it is a page, otherwise the 404 page. GitHub Pages
 * answers an unknown URL with `404.html`, so the markup in the document is the 404 page whatever the URL says.
 * `/index.html` and `/work/<slug>/index.html` are the same documents as `/` and `/work/<slug>/`.
 */
export function routeFor(resume: Resume, pathname: string): string {
  const path = pathname.replace(/index\.html$/, '');
  return routes(resume).some((route) => route.path === path) ? path : NOT_FOUND_PATH;
}
