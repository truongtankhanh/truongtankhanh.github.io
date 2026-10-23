export interface Link {
  label: string;
  href: string;
}

/** A month in `YYYY-MM` form, so ranges sort and compare as plain strings. */
export type Month = `${number}-${number}`;

export interface Role {
  company: string;
  title: string;
  start: Month;
  /** Omitted while the role is current. */
  end?: Month;
  summary?: string;
  /** Named engagements inside the role; each has its own bullets. */
  work: Engagement[];
}

export interface Engagement {
  name?: string;
  context?: string;
  /** Bullets. A key phrase may be wrapped in `**double asterisks**`; see `src/lib/emphasis.ts`. */
  points: string[];
  link?: Link;
}

/** The page behind a project card. Filled in V1-11 and V1-12; V1-10.1 adds the section fields the template needs. */
export interface CaseStudy {
  /** Last segment of the route, `/work/<slug>/`. */
  slug: string;
  lead: string;
  role: string;
  status: string;
}

export type ProjectId = 'occ' | 'telemetry' | 'aws' | 'adr' | 'pipelines';

export interface Project {
  id: ProjectId;
  name: string;
  repo: string;
  /** One sentence, plain language: what it is for. */
  what: string;
  /** The claim a reviewer can check in the repository. */
  proof: string;
  /** The claims of `proof` as a checklist: split on its commas and semicolons, capitalisation changed, final "and" dropped. */
  checks: string[];
  /** One key figure for the project card. The featured project has none. */
  stat?: { value: string; label: string };
  /** The words of `proof` that `stat` restates, quoted exactly, so no figure is invented. */
  statSource?: string;
  stack: string[];
  image?: { src: string; alt: string; caption: string };
  caseStudy?: CaseStudy;
}

export interface SkillGroup {
  name: string;
  items: string[];
  /** Where the group was used: each entry is a `Project.name` or a `Role.company`, so the claim can be checked. */
  usedIn: string[];
}

/** A career figure for the hero strip. Every one must trace to a fact elsewhere in the content. */
export interface Metric {
  /** Kept exactly as in the CV, with its "~" or "+". */
  value: string;
  label: string;
  /** Short caption saying where the figure comes from. */
  source: string;
}

/** A line quoted from the work that backs a principle. `source` names the role, engagement or repository it comes from. */
export interface Evidence {
  text: string;
  source: string;
}

export interface Resume {
  name: string;
  /** ASCII spelling for contexts that drop diacritics (file names, ATS). */
  nameAscii: string;
  headline: string;
  intro: string[];
  /** The six technologies the CV summary names; each also appears in a skill group. */
  coreStack: string[];
  location: string;
  timezone: string;
  availability: string;
  email: string;
  /** Canonical origin with a trailing slash; absolute URLs in the head, sitemap and JSON-LD start here. */
  siteUrl: string;
  /** File name of the public CV PDF, built into `dist/` by `scripts/build-pdf.js`. */
  cvPdf: string;
  /** The public CV: `pdf` is the root-relative URL, `fileName` the ASCII name the download is saved under. */
  cv: { pdf: string; fileName: string };
  links: { github: string; linkedin: string };
  /** In career order, early to recent. */
  metrics: Metric[];
  projects: Project[];
  experience: Role[];
  skills: SkillGroup[];
  principles: { title: string; body: string; evidence: Evidence[] }[];
  /** The scope card of "How I work". */
  leadership: { figures: { value: string; label: string }[]; owns: string[] };
  education: { school: string; detail: string; start: number; end: number };
  languages: { name: string; level: string; detail?: string }[];
}
