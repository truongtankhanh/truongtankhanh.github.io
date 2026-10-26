import type { Engagement, Project, Resume, Role } from '../content/types';
import { downloadLabel } from '../lib/cv';
import { formatRange } from '../lib/dates';
import { emphasis } from '../lib/emphasis';
import { displayUrl } from '../lib/urls';
import { Icon } from './Icon';
import { Logo } from './Logo';

/** A value as a CSS string. Backslash, quote, angle bracket and line break are escaped, so no field can end the string or the `<style>` element. */
function cssString(value: string): string {
  return `"${value.replace(/[\\"<\n]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)}"`;
}

/**
 * The running footer of each printed page, as a page-margin box of the named page `cv` (see `styles.css`): the name and
 * role at the left of every page; the page count at the right is written by the stylesheet. CSS cannot read the
 * content file, so the words are written into the page here.
 */
function footerCss(r: Resume): string {
  return `@page cv{@bottom-left{content:${cssString(`${r.name} · ${r.headline}`)}}}`;
}

/** Text with its key phrases between `**` rendered as `<strong>`. */
function Rich({ text }: { text: string }) {
  return (
    <>{emphasis(text).map((part, i) => (part.strong ? <strong key={i}>{part.text}</strong> : part.text))}</>
  );
}

/**
 * The navy band that opens the page: location, name with the monogram, role and two contact lines. There is no phone
 * number: the public edition keeps it private on purpose.
 */
function Header({ resume: r }: { resume: Resume }) {
  const link = (href: string, text: string) => (
    <li>
      <a href={href}>{text}</a>
    </li>
  );
  return (
    <header className="cv-head">
      <p className="cv-location">
        {r.location} · {r.timezone}
      </p>
      <div className="cv-head-top">
        <h1 className="cv-name" lang="vi">
          {r.name}
        </h1>
        <Logo variant="dark" className="cv-mark" />
      </div>
      <p className="cv-headline">{r.headline}</p>
      <ul className="cv-links" aria-label="Contact">
        {link(`mailto:${r.email}`, r.email)}
        {link(r.siteUrl, displayUrl(r.siteUrl))}
      </ul>
      <ul className="cv-links" aria-label="Profiles">
        {link(r.links.github, displayUrl(r.links.github))}
        {link(r.links.linkedin, displayUrl(r.links.linkedin))}
      </ul>
    </header>
  );
}

/** A named engagement runs its name in bold into its context; an unnamed one has bullets only. */
function EngagementBlock({ engagement }: { engagement: Engagement }) {
  const { name, context } = engagement;
  return (
    <div className="cv-eng">
      {(name || context) && (
        <p className="cv-eng-lead">
          {name && <strong>{context ? `${name}.` : name}</strong>}
          {name && context && ' '}
          {context}
        </p>
      )}
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
  const classes = ['cv-role', role.work.length > 1 ? 'is-long' : ''].filter(Boolean).join(' ');
  return (
    <li className={classes}>
      <div className="cv-role-head">
        <h3>{role.company}</h3>
        <p className="cv-when">{formatRange(role.start, role.end)}</p>
      </div>
      <p className="cv-role-title">{role.title}</p>
      {role.summary && <p className="cv-role-summary">{role.summary}</p>}
      {role.work.map((w, i) => (
        <EngagementBlock key={w.name ?? i} engagement={w} />
      ))}
    </li>
  );
}

/** Every repository leads with one figure: its own, or else the one its case study leads with. Two lines: the name with its figure, then the address. */
function WorkRow({ project }: { project: Project }) {
  const figure = project.stat ?? project.caseStudy?.does.lead.figure;
  return (
    <li className="cv-work">
      <p className="cv-work-line">
        <strong>{project.name}</strong>
        {figure && (
          <>
            <span className="cv-sep" aria-hidden="true">
              {' · '}
            </span>
            <b className="cv-figure">{figure.value}</b> – {figure.label}
          </>
        )}
      </p>
      <p className="cv-work-repo">
        <a href={project.repo}>{displayUrl(project.repo)}</a>
      </p>
    </li>
  );
}

/**
 * The CV as a page, in the order and the look of the Word edition (`scripts/application-cv`) without its phone number:
 * the navy band, the strip of career figures, summary, technical skills, experience, public work, how I work, and
 * education and languages. One column in reading order, so the PDF that is printed from this route parses cleanly.
 * Every word comes from `resume`; the component adds only the headings and labels. On paper the route flows and the
 * named page `cv` (see `styles.css`) paginates it.
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
        {/* On screen only: the bar does not print, and the PDF is printed from a build that has no PDF yet. */}
        {r.cv.published && (
          <a href={r.cv.pdf} download={r.cv.fileName} aria-label={downloadLabel(r.cv, 'Download CV')}>
            <Icon name="download" />
            Download CV (PDF)
          </a>
        )}
      </nav>

      <main id="main" className="cv-sheet">
        <Header resume={r} />

        <ul className="cv-figures" aria-label="Career at a glance">
          {r.metrics.map((m) => (
            <li key={`${m.value} ${m.label}`}>
              <b className="cv-figure">{m.value}</b> {m.short ?? m.label}
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

        <section aria-labelledby="cv-skills">
          <h2 id="cv-skills" className="cv-sec">
            Technical Skills
          </h2>
          <dl className="cv-rows">
            {r.skills.map((group) => (
              <div key={group.name}>
                <dt>{group.name}</dt>
                <dd>{group.items.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="cv-experience">
          <h2 id="cv-experience" className="cv-sec">
            Experience
          </h2>
          <ol className="cv-roles">
            {r.experience.map((role) => (
              <RoleItem key={role.company} role={role} />
            ))}
          </ol>
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
          <ul className="cv-principles">
            {r.principles.map((p) => (
              <li key={p.title}>
                <strong>{p.title}.</strong> {p.body}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="cv-facts">
          <h2 id="cv-facts" className="cv-sec">
            Education and languages
          </h2>
          <dl className="cv-rows">
            <div>
              <dt>Education</dt>
              <dd>
                {r.education.school}, {r.education.detail} ({r.education.start}–{r.education.end})
              </dd>
            </div>
            <div>
              <dt>Languages</dt>
              <dd>
                {r.languages.map((l) => (
                  <span key={l.name} className="cv-line">
                    {l.name} · {l.level}
                    {l.detail ? `. ${l.detail}` : ''}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
