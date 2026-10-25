import type { Engagement, Project, Resume, Role } from '../content/types';
import { formatRange } from '../lib/dates';
import { emphasis } from '../lib/emphasis';
import { displayUrl } from '../lib/urls';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { GROUP_ICON } from './Skills';

/** A value as a CSS string. Backslash, quote, angle bracket and line break are escaped, so no field can end the string or the `<style>` element. */
function cssString(value: string): string {
  return `"${value.replace(/[\\"<\n]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)}"`;
}

/**
 * The running footer of each printed page, as page-margin boxes of the named page `cv` (see `styles.css`): the name and
 * role on page 1, the site on the others. CSS cannot read the content file, so the words are written into the page here.
 */
function footerCss(r: Resume): string {
  return (
    `@page cv{@bottom-left{content:${cssString(displayUrl(r.siteUrl))}}}` +
    `@page cv:first{@bottom-left{content:${cssString(`${r.name} · ${r.headline}`)}}}`
  );
}

/** Text with its key phrases between `**` rendered as `<strong>`. */
function Rich({ text }: { text: string }) {
  return (
    <>{emphasis(text).map((part, i) => (part.strong ? <strong key={i}>{part.text}</strong> : part.text))}</>
  );
}

function Header({ resume: r }: { resume: Resume }) {
  return (
    <header className="cv-head">
      <div className="cv-head-top">
        <div>
          <p className="cv-label cv-eyebrow">
            {r.location} · {r.timezone}
          </p>
          <h1 className="cv-name" lang="vi">
            {r.name}
          </h1>
          <p className="cv-headline">{r.headline}</p>
        </div>
        <Logo variant="light" className="cv-mark" />
      </div>
      {/* No phone number: the public edition keeps it private on purpose. */}
      <ul className="cv-links" aria-label="Contact">
        <li>
          <a href={`mailto:${r.email}`}>{r.email}</a>
        </li>
        <li>
          <a href={r.siteUrl}>{displayUrl(r.siteUrl)}</a>
        </li>
        <li>
          <a href={r.links.github}>{displayUrl(r.links.github)}</a>
        </li>
        <li>
          <a href={r.links.linkedin}>{displayUrl(r.links.linkedin)}</a>
        </li>
      </ul>
      <div className="cv-core">
        <p className="cv-label">Core stack</p>
        <ul aria-label="Core stack">
          {r.coreStack.map((tool) => (
            <li key={tool} className="cv-chip">
              {tool}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

function EngagementBlock({ engagement }: { engagement: Engagement }) {
  return (
    <div className="cv-eng">
      {engagement.name && <h4>{engagement.name}</h4>}
      {engagement.context && <p className="cv-eng-context">{engagement.context}</p>}
      <ul className="cv-bullets">
        {engagement.points.map((point) => (
          <li key={point}>
            <Rich text={point} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleItem({ role }: { role: Role }) {
  // A role of several engagements may break between them, so a long current role cannot leave a page half empty.
  const classes = ['cv-role', role.end ? '' : 'is-current', role.work.length > 1 ? 'is-long' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <li className={classes}>
      <div className="cv-when">
        <p className="cv-label">{formatRange(role.start, role.end)}</p>
        {!role.end && <p className="cv-badge">Current</p>}
      </div>
      <div className="cv-rail" aria-hidden="true">
        <i />
      </div>
      <div className="cv-role-body">
        <h3>
          {role.company} <small>{role.title}</small>
        </h3>
        {role.summary && <p className="cv-role-summary">{role.summary}</p>}
        {role.work.map((w, i) => (
          <EngagementBlock key={w.name ?? i} engagement={w} />
        ))}
      </div>
    </li>
  );
}

/** Every repository leads with one figure: its own, or else the one its case study leads with. */
function WorkRow({ project }: { project: Project }) {
  const figure = project.stat ?? project.caseStudy?.does.lead.figure;
  return (
    <li className="cv-work cv-plate">
      <p className="cv-work-figure">
        {figure && (
          <>
            <b>{figure.value}</b>
            <span>{figure.label}</span>
          </>
        )}
      </p>
      <div>
        <h3>{project.name}</h3>
        <p>{project.what}</p>
        <p className="cv-work-proof">{project.proof}</p>
        <ul className="cv-work-stack" aria-label="Stack">
          {project.stack.map((item) => (
            <li key={item} className="cv-chip">
              {item}
            </li>
          ))}
        </ul>
        <p className="cv-label cv-work-repo">
          <a href={project.repo}>{displayUrl(project.repo)}</a>
        </p>
      </div>
    </li>
  );
}

/**
 * The CV as a page, in the order of frame 05: header and career figures, summary, experience, skills, public work,
 * how I work, education and languages, and a closing contact box. One column in reading order, so the PDF that is
 * printed from this route parses cleanly. Every word comes from `resume`; the component adds only the headings and
 * labels. On paper the route flows and the named page `cv` (see `styles.css`) paginates it.
 */
export function PrintCv({ resume: r }: { resume: Resume }) {
  return (
    <div className="cv">
      <style dangerouslySetInnerHTML={{ __html: footerCss(r) }} />
      <nav className="cv-bar" aria-label="Back to the site">
        <a href="/">
          <Icon name="home" />
          Back to the site
        </a>
      </nav>

      <main id="main" className="cv-sheet">
        <Header resume={r} />

        <ul className="cv-figures cv-plate" aria-label="Career at a glance">
          {r.metrics.map((m) => (
            <li key={`${m.value} ${m.label}`}>
              <b>{m.value}</b>
              <span>{m.label}</span>
            </li>
          ))}
        </ul>

        <section aria-labelledby="cv-summary">
          <h2 id="cv-summary" className="cv-sec">
            Summary
          </h2>
          {r.intro.map((paragraph) => (
            <p key={paragraph} className="cv-summary">
              {paragraph}
            </p>
          ))}
        </section>

        <section aria-labelledby="cv-experience">
          <h2 id="cv-experience" className="cv-sec">
            Experience
          </h2>
          <ol className="cv-timeline">
            {r.experience.map((role) => (
              <RoleItem key={role.company} role={role} />
            ))}
          </ol>
        </section>

        <section aria-labelledby="cv-skills">
          <h2 id="cv-skills" className="cv-sec">
            Skills
          </h2>
          <ul className="cv-skill-grid">
            {r.skills.map((group) => (
              <li key={group.name} className="cv-skill cv-plate">
                <div className="cv-skill-head">
                  <Icon name={GROUP_ICON[group.kind]} className="cv-skill-icon" />
                  <h3>{group.name}</h3>
                </div>
                <ul aria-label={group.name}>
                  {group.items.map((item) => (
                    <li key={item} className="cv-chip">
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section className="cv-public" aria-labelledby="cv-public">
          <h2 id="cv-public" className="cv-sec">
            Public work
          </h2>
          <ul className="cv-work-list">
            {r.projects.map((p) => (
              <WorkRow key={p.id} project={p} />
            ))}
          </ul>
        </section>

        <section className="cv-approach" aria-labelledby="cv-approach">
          <h2 id="cv-approach" className="cv-sec">
            How I work
          </h2>
          <div className="cv-scope cv-plate">
            <ul className="cv-scope-figures" aria-label="Scope of leadership">
              {r.leadership.figures.map((f) => (
                <li key={f.value}>
                  <b>{f.value}</b>
                  <span>{f.label}</span>
                </li>
              ))}
            </ul>
            <div className="cv-scope-owns">
              <p className="cv-label">What I own</p>
              <ul className="cv-bullets">
                {r.leadership.owns.map((own) => (
                  <li key={own}>{own}</li>
                ))}
              </ul>
            </div>
          </div>
          <ul className="cv-principles">
            {r.principles.map((p) => (
              <li key={p.title} className="cv-principle cv-plate">
                <h3>{p.title}</h3>
                <p>{p.body}</p>
                <p className="cv-label cv-principle-label">In practice</p>
                <ul>
                  {p.evidence.map((e) => (
                    <li key={e.text}>
                      {e.text}
                      <small>{e.source}</small>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <h2 className="cv-sec">Education and languages</h2>
          <dl className="cv-facts">
            <div>
              <dt className="cv-label">Education</dt>
              <dd className="cv-fact-main">{r.education.school}</dd>
              <dd className="cv-fact-sub">
                {r.education.detail} ({r.education.start}–{r.education.end})
              </dd>
            </div>
            {r.languages.map((l) => (
              <div key={l.name}>
                <dt className="cv-label">{l.name}</dt>
                <dd className="cv-fact-main">{l.level}</dd>
                {l.detail && <dd className="cv-fact-sub">{l.detail}</dd>}
              </div>
            ))}
          </dl>
        </section>

        {/* Follows the content instead of sitting at the foot of the page, so a longer CV cannot push it off. */}
        <section className="cv-close cv-plate" aria-labelledby="cv-close-title">
          <div>
            <h2 id="cv-close-title">Let’s talk</h2>
            <p>{r.availability}.</p>
          </div>
          <div>
            <a className="cv-mail cv-plate" href={`mailto:${r.email}`}>
              <span className="cv-label">Email</span>
              {r.email}
            </a>
            <ul>
              <li className="cv-plate">
                <a href={r.links.github}>
                  <b>GitHub</b>
                  <span>{displayUrl(r.links.github)}</span>
                </a>
              </li>
              <li className="cv-plate">
                <a href={r.links.linkedin}>
                  <b>LinkedIn</b>
                  <span>{displayUrl(r.links.linkedin)}</span>
                </a>
              </li>
              <li className="cv-plate">
                <a href={r.siteUrl}>
                  <b>Website</b>
                  <span>{displayUrl(r.siteUrl)}</span>
                </a>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
