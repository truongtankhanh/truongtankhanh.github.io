import type { IconName } from '../components/Icon';

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

/** A screenshot of the running project. Every one is 1600 × 900. */
export interface Screenshot {
  /** Relative to the site root, without a leading slash: `images/console-overview.webp`. */
  src: string;
  alt: string;
  caption: string;
}

/** One thing the project does. A key phrase may be wrapped in `**double asterisks**`; see `src/lib/emphasis.ts`. */
export interface Capability {
  title: string;
  text: string;
}

/** One written decision of the repository: its id, its real title, and one line on why. */
export interface Decision {
  /** As the repository writes it, such as `ADR-0007`. */
  id: string;
  title: string;
  why: string;
}

/** A claim of the project and the files of its repository that show it. */
export interface ClaimSource {
  claim: string;
  /** Paths inside the project's own repository, such as `lib/nag.ts`; the page links each one on its `main` branch. */
  files: string[];
}

/**
 * The page behind a project card, in the order of the page. Every sentence is quoted or paraphrased from the README
 * or an ADR of the repository (V1-11 and V1-12 record the source line of each); the template adds only the headings.
 */
export interface CaseStudy {
  /** Last segment of the route, `/work/<slug>/`. */
  slug: string;
  lead: string;
  role: string;
  status: string;
  /** Paragraphs under the screenshot of `Project.image`. */
  overview: string[];
  /** "What it does": one lead capability with the key figure of the README, then the cards beside it. */
  does: {
    lead: Capability & { figure: { value: string; label: string }; image?: Screenshot };
    /** Three cards. The icon is picked by the content, because only the content knows what each one is about. */
    more: (Capability & { icon: IconName })[];
  };
  /** "Decisions that shaped it". */
  decisions: Decision[];
  /** "How to check it", one paragraph each. */
  check: string[];
  /** Under "How to check it": each claim of the project card and the files that show it. */
  sources?: ClaimSource[];
  /** "Run it": the sentence above the commands and the commands as the README prints them. */
  run: { intro: string; commands: string };
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

/** What a skill group is about; the card picks its icon from it. */
export type SkillKind = 'backend' | 'frontend' | 'data' | 'cloud' | 'practice';

export interface SkillGroup {
  kind: SkillKind;
  name: string;
  items: string[];
  /** Where the group was used: each entry is a `Project.name` or a `Role.company`, so the claim can be checked. */
  usedIn: string[];
}

/** One box of the architecture diagram: a repository (drawn from the project it names) or a party outside the code. */
export type ArchNode = { project: ProjectId; note: string } | { name: string; note: string };

/** How the repositories fit together. Every label is worded from the `what` and `proof` of the projects it names. */
export interface Architecture {
  title: string;
  summary: string;
  /** The boxes in reading order. */
  nodes: ArchNode[];
  /** What travels between box `i` and box `i + 1`, so one label fewer than `nodes`. */
  flows: string[];
  /** The band under the row: the project that hosts both systems, and what it runs. */
  platform: { project: ProjectId; services: string[]; note: string };
}

export type StackLayerId = 'frontend' | 'backend' | 'data' | 'cloud';

/** One layer of the hero's technology stack. `items` are picks from the skill group named `group`. */
export interface StackLayer {
  id: StackLayerId;
  label: string;
  /** The `SkillGroup.name` the items come from, so each one can be checked against the skills list. */
  group: string;
  items: string[];
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
  /** The line under "Core stack": the CV's own summary of those tools. Every `coreStack` entry is named in it. */
  coreStackNote: string;
  /** The four layers drawn in the hero, front to back. */
  heroStack: StackLayer[];
  /** The "Currently" fact of the hero, after the company and before "since <start of the current role>". */
  currentlyNote: string;
  location: string;
  timezone: string;
  availability: string;
  email: string;
  /** Canonical origin with a trailing slash; absolute URLs in the head, sitemap and JSON-LD start here. */
  siteUrl: string;
  /** File name of the public CV PDF, built into `dist/` by `scripts/build-pdf.js`. */
  cvPdf: string;
  /**
   * The public CV: `pdf` is the root-relative URL, `fileName` the ASCII name the download is saved under.
   * `published` stays false until V1-14 ships the new file; the header hides its link until then.
   */
  cv: { pdf: string; fileName: string; published: boolean };
  links: { github: string; linkedin: string };
  /** In career order, early to recent. */
  metrics: Metric[];
  projects: Project[];
  architecture: Architecture;
  experience: Role[];
  skills: SkillGroup[];
  principles: { title: string; body: string; evidence: Evidence[] }[];
  /** The scope card of "How I work". */
  leadership: { figures: { value: string; label: string }[]; owns: string[] };
  education: { school: string; detail: string; start: number; end: number };
  languages: { name: string; level: string; detail?: string }[];
}
