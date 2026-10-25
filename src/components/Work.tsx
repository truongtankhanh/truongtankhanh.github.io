import type { Project } from '../content/types';
import { Icon } from './Icon';
import { Platform } from './Platform';

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="chip-list" aria-label="Stack">
      {items.map((item) => (
        <li key={item} className="chip">
          {item}
        </li>
      ))}
    </ul>
  );
}

/** The repository link: its visible text stays the same on every card, and the project name follows for screen readers. */
function RepoLink({
  project,
  className,
  children,
}: {
  project: Project;
  className?: string;
  children: string;
}) {
  return (
    <a className={className} href={project.repo}>
      {children}
      <span className="sr-only"> for {project.name}</span>
    </a>
  );
}

/** The lead project: what it is and what a reviewer can check in the code, all visible without a click. */
function FeaturedProject({ project }: { project: Project }) {
  return (
    <article className="featured plate-dark">
      <div className="featured-body">
        <p className="featured-tag">Featured project</p>
        <h3>{project.name}</h3>
        <p className="featured-what">{project.what}</p>
        <Chips items={project.stack} />
        <div className="featured-actions">
          {/* Only a project with a case study page links to it, so no link points at a page that does not exist. */}
          {project.caseStudy && (
            <a className="btn btn-primary btn-on-band" href={`/work/${project.caseStudy.slug}/`}>
              Read the case study
            </a>
          )}
          <RepoLink project={project} className="btn btn-on-band">
            Repository
          </RepoLink>
        </div>
      </div>
      <div className="featured-side">
        <h4>What you can check in the code</h4>
        <ul className="check-list">
          {project.checks.map((check) => (
            <li key={check}>
              <Icon name="check" className="icon check-mark" />
              <span>{check}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="project-card plate">
      <div className="project-head">
        <h3>{project.name}</h3>
        <Icon name="arrowUpRight" className="icon project-arrow" />
      </div>
      <p className="project-what">{project.what}</p>
      {project.stat && (
        <p className="project-stat">
          <span className="stat-value">{project.stat.value}</span> <span>{project.stat.label}</span>
        </p>
      )}
      <ul className="tick-list">
        {project.checks.map((check) => (
          <li key={check}>{check}</li>
        ))}
      </ul>
      <Chips items={project.stack} />
      <div className="project-foot">
        <RepoLink project={project}>View repository</RepoLink>
      </div>
    </article>
  );
}

/** The public work: the lead project, a card for each of the others, and, until V1-06.3, the platform diagram. */
export function Work({ projects }: { projects: Project[] }) {
  const [featured, ...others] = projects;
  return (
    <section id="work" className="section" aria-labelledby="work-title">
      <div className="sec-head">
        <h2 id="work-title">Public work</h2>
        <p>
          Five repositories that fit together as one campus operations platform. The campus is fictional; the
          engineering is the kind a real deployment needs, and every claim below can be checked in the code.
        </p>
      </div>
      {featured && <FeaturedProject project={featured} />}
      <ul className="project-grid">
        {others.map((p) => (
          <li key={p.id}>
            <ProjectCard project={p} />
          </li>
        ))}
      </ul>
      <Platform projects={projects} />

      {/* Printed CVs can't use the diagram, so print gets a plain list instead. */}
      <ul className="print-only print-projects">
        {projects.map((p) => (
          <li key={p.id}>
            <strong>{p.name}</strong> ({p.repo.replace('https://', '')}): {p.what}
          </li>
        ))}
      </ul>
    </section>
  );
}
