import type { Resume } from './content/types';

export interface Route {
  /** Root-relative, with a trailing slash except for files such as `/404.html`. */
  path: string;
  /** Served but kept out of the sitemap and search results (the CV page and the 404 page). */
  noindex?: boolean;
}

/** GitHub Pages serves this file, with status 404, for any URL it has no page for. */
export const NOT_FOUND_PATH = '/404.html';

/** The CV as a page: the layout the public PDF is printed from. */
export const CV_PATH = '/cv/';

/** Every page the site serves. The sitemap reads this list, so a new case study needs no second edit. */
export function routes(resume: Resume): Route[] {
  return [
    { path: '/' },
    ...resume.projects.flatMap((p) => (p.caseStudy ? [{ path: `/work/${p.caseStudy.slug}/` }] : [])),
    // The PDF built from this page is the indexed artefact, so the page itself stays out of search results.
    { path: CV_PATH, noindex: true },
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
