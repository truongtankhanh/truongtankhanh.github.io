import type { Resume } from './content/types';

export interface Route {
  /** Root-relative, with a trailing slash except for files such as `/404.html`. */
  path: string;
  /** Served but kept out of the sitemap and search results (`/cv/` and the 404 page, when they exist). */
  noindex?: boolean;
}

/** Every page the site serves. The sitemap reads this list, so a new case study needs no second edit. */
export function routes(resume: Resume): Route[] {
  return [
    { path: '/' },
    ...resume.projects.flatMap((p) => (p.caseStudy ? [{ path: `/work/${p.caseStudy.slug}/` }] : [])),
  ];
}
