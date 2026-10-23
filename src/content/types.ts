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
  points: string[];
  link?: Link;
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
  stack: string[];
  image?: { src: string; alt: string; caption: string };
}

export interface SkillGroup {
  name: string;
  items: string[];
}

export interface Resume {
  name: string;
  /** ASCII spelling for contexts that drop diacritics (file names, ATS). */
  nameAscii: string;
  headline: string;
  intro: string[];
  location: string;
  timezone: string;
  availability: string;
  email: string;
  /** Canonical origin with a trailing slash; absolute URLs in the head, sitemap and JSON-LD start here. */
  siteUrl: string;
  /** File name of the public CV PDF, built into `dist/` by `scripts/build-pdf.js`. */
  cvPdf: string;
  links: { github: string; linkedin: string };
  projects: Project[];
  experience: Role[];
  skills: SkillGroup[];
  principles: { title: string; body: string }[];
  education: { school: string; detail: string; start: number; end: number };
  languages: { name: string; level: string }[];
}
