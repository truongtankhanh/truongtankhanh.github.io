import { useEffect, useState, type ReactNode } from 'react';
import type { Project, Resume, Screenshot } from '../content/types';
import { emphasis } from '../lib/emphasis';
import { displayUrl } from '../lib/urls';
import { HeroSun } from './Hero';
import { Icon } from './Icon';
import { SiteHeader } from './SiteHeader';

/** The sections in page order. The contents list and the section headings both read this, so they cannot drift. */
const SECTIONS = [
  { id: 'overview', label: 'Overview', heading: 'Overview' },
  { id: 'does', label: 'What it does', heading: 'What it does' },
  { id: 'decisions', label: 'Decisions', heading: 'Decisions that shaped it' },
  { id: 'check', label: 'How to check it', heading: 'How to check it' },
  { id: 'run', label: 'Run it', heading: 'Run it' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

/** Every screenshot is 1600 × 900; the size is set so the page does not shift while the image loads. */
const SHOT_SIZE = { width: 1600, height: 900 };

/** Text with its key phrases between `**` rendered as `<strong>`. */
function Rich({ text }: { text: string }) {
  return (
    <>{emphasis(text).map((part, i) => (part.strong ? <strong key={i}>{part.text}</strong> : part.text))}</>
  );
}

function Shot({ shot, lazy }: { shot: Screenshot; lazy?: boolean }) {
  return (
    <img
      src={`/${shot.src}`}
      alt={shot.alt}
      {...SHOT_SIZE}
      decoding="async"
      loading={lazy ? 'lazy' : undefined}
    />
  );
}

/** The repository as "<name>" over "<owner URL>", taken from the one URL the project already has. */
function repoParts(repo: string) {
  const url = new URL(repo);
  const segments = url.pathname.split('/').filter(Boolean);
  return {
    name: segments.at(-1) ?? repo,
    owner: displayUrl(`${url.origin}/${segments.slice(0, -1).join('/')}`),
  };
}

/**
 * "On this page": a rail with a node per section. The section being read is set by an `IntersectionObserver` as the
 * page scrolls, and at once on a click, so the mark does not wait for the scroll to arrive.
 */
function Contents() {
  const [active, setActive] = useState<SectionId>(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id as SectionId);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="cs-toc-wrap">
      <p className="cs-label cs-toc-title">On this page</p>
      <nav className="cs-toc" aria-label="On this page">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active === section.id ? 'location' : undefined}
            onClick={() => setActive(section.id)}
          >
            {section.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

/** A section of the article. It takes focus when a contents link or a deep link lands on it. */
function Section({ id, children }: { id: SectionId; children: ReactNode }) {
  const section = SECTIONS.find((s) => s.id === id)!;
  return (
    <section id={id} aria-labelledby={`${id}-title`} tabIndex={-1}>
      <h2 id={`${id}-title`}>{section.heading}</h2>
      {children}
    </section>
  );
}

function Pager({ resume, project }: { resume: Resume; project: Project }) {
  // Only a project with a case study is linked, so no link points at a page that does not exist.
  const studies = resume.projects.filter((p) => p.caseStudy);
  const at = studies.findIndex((p) => p.id === project.id);
  const previous = studies[at - 1];
  const next = studies[at + 1];
  const to = (p: Project) => `/work/${p.caseStudy!.slug}/`;
  return (
    <nav className="cs-pager" aria-label="More work">
      <a href={previous ? to(previous) : '/#work'}>
        <small className="cs-label">Previous</small> {previous ? previous.name : 'Back to all work'}
      </a>
      {next && (
        <a href={to(next)}>
          <small className="cs-label">Next</small> {next.name}
        </a>
      )}
    </nav>
  );
}

/**
 * The page behind a project card (frame 04): a head in the colour of the home hero, the four facts straddling its
 * lower edge, the contents list beside the article, and the previous and next case study. All text comes from
 * `project.caseStudy`; this component adds only the headings and labels.
 */
export function CaseStudy({ resume, project }: { resume: Resume; project: Project }) {
  const study = project.caseStudy;
  if (!study) throw new Error(`${project.name} has no case study`);
  const repo = repoParts(project.repo);
  const { lead, more } = study.does;

  return (
    <div className="site">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <SiteHeader home={false} current="work" />

      <main id="main">
        <section className="hero cs-hero" aria-labelledby="cs-title">
          <HeroSun />
          <div className="hero-inner">
            <div className="hero-text">
              <nav aria-label="Breadcrumb">
                <ol className="cs-crumbs">
                  <li>
                    <a href="/#work">Work</a>
                  </li>
                  <li aria-current="page">{project.name}</li>
                </ol>
              </nav>
              <p className="hero-meta">Case study</p>
              <h1 id="cs-title" className="text-silver">
                {project.name}
              </h1>
              <p className="intro cs-lead">{study.lead}</p>
              <div className="cs-cta">
                <a className="btn btn-primary btn-on-band" href={project.repo}>
                  Open the repository
                  <Icon name="arrowUpRight" />
                </a>
                <a className="btn btn-on-band" href="#run">
                  Run it yourself
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* The band continues behind the upper half of the cards, so they straddle its edge at any height. */}
        <div className="cs-facts-band">
          <div className="hero-inner">
            <dl className="cs-facts">
              <div className="cs-fact plate">
                <dt className="cs-label">Role</dt>
                <dd>{study.role}</dd>
              </div>
              <div className="cs-fact plate">
                <dt className="cs-label">Stack</dt>
                <dd>{project.stack.join(' · ')}</dd>
              </div>
              <div className="cs-fact plate">
                <dt className="cs-label">Status</dt>
                <dd>{study.status}</dd>
              </div>
              <div className="cs-fact plate">
                <dt className="cs-label">Source</dt>
                <dd>
                  <a href={project.repo}>{repo.name}</a>
                  <small>{repo.owner}</small>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="page cs-body">
          <aside>
            <Contents />
          </aside>

          <div className="cs-article">
            <Section id="overview">
              {project.image && (
                <figure className="cs-figure">
                  <div className="cs-shot">
                    <div className="cs-shot-bar" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </div>
                    <Shot shot={project.image} />
                  </div>
                  <figcaption className="cs-label cs-caption">{project.image.caption}</figcaption>
                </figure>
              )}
              {study.overview.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </Section>

            <Section id="does">
              <article
                className={
                  lead.image ? 'cs-lead-card plate-dark' : 'cs-lead-card cs-lead-card-solo plate-dark'
                }
              >
                <div className="cs-lead-copy">
                  <p className="cs-stat">
                    <b>{lead.figure.value}</b>
                    <span>{lead.figure.label}</span>
                  </p>
                  <h3>{lead.title}</h3>
                  <p>
                    <Rich text={lead.text} />
                  </p>
                </div>
                {lead.image && (
                  <figure className="cs-lead-shot">
                    <Shot shot={lead.image} lazy />
                    <figcaption className="cs-label cs-caption">{lead.image.caption}</figcaption>
                  </figure>
                )}
              </article>
              <div className="cs-cards">
                {more.map((card) => (
                  <article key={card.title} className="cs-card plate">
                    <Icon name={card.icon} className="icon cs-card-icon" />
                    <h3>{card.title}</h3>
                    <p>
                      <Rich text={card.text} />
                    </p>
                  </article>
                ))}
              </div>
            </Section>

            <Section id="decisions">
              <p>Each one is a written decision record in the repository.</p>
              <ul className="cs-decisions">
                {study.decisions.map((decision) => (
                  <li key={decision.id} className="plate">
                    <b>{decision.id}</b>
                    <span>
                      <strong>{decision.title}.</strong> {decision.why}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="check">
              {study.check.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {study.sources && study.sources.length > 0 && (
                <>
                  <p>Each claim of the project card, and the files in the repository that show it:</p>
                  <ul className="cs-sources">
                    {study.sources.map((source) => (
                      <li key={source.claim} className="plate">
                        <span>{source.claim}</span>
                        <span className="cs-sources-files">
                          {source.files.map((file) => (
                            <a key={file} href={`${project.repo}/blob/main/${file}`}>
                              <code>{file}</code>
                            </a>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Section>

            <Section id="run">
              <p>{study.run.intro}</p>
              {/* A keyboard user can scroll a long line: the block is focusable. */}
              <pre className="cs-code" tabIndex={0}>
                <code>{study.run.commands}</code>
              </pre>
              <div className="cs-run-actions">
                <a className="btn btn-primary btn-small" href={project.repo}>
                  Open the repository
                </a>
                <a className="btn btn-small" href="/#work">
                  All work
                </a>
              </div>
            </Section>

            <Pager resume={resume} project={project} />
          </div>
        </div>
      </main>
    </div>
  );
}
