import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/800.css';

import { resume } from './content/resume';
import { formatMonth } from './lib/dates';
import { stripEmphasis } from './lib/emphasis';
import { Contours } from './components/Contours';
import { Platform } from './components/Platform';
import { SiteHeader } from './components/SiteHeader';

// Fixed at build time (see vite.config.ts) so server and client render the same date.
const BUILT = __BUILD_DATE__;

export function App() {
  const r = resume;
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main">
        <section className="hero" aria-labelledby="name">
          <Contours />
          <div className="hero-text">
            <h1 id="name">
              <span lang="vi">{r.name}</span>
            </h1>
            <p className="headline">{r.headline}</p>
            {r.intro.map((p) => (
              <p key={p} className="intro">
                {p}
              </p>
            ))}
            <p className="where">
              {r.location}, {r.timezone}. {r.availability}.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href={`mailto:${r.email}`}>
                Email me
              </a>
              <a className="button" href={`/${r.cvPdf}`} download={r.cvPdf}>
                Download CV (PDF)
              </a>
              <a className="button" href={r.links.github}>
                GitHub
              </a>
              <a className="button" href={r.links.linkedin}>
                LinkedIn
              </a>
            </div>
          </div>
        </section>

        <section id="work" className="section" aria-labelledby="work-title">
          <div className="section-head">
            <h2 id="work-title">Public work</h2>
            <p>
              Five repositories that fit together as one campus operations platform. The campus is fictional;
              the engineering is the kind a real deployment needs, and every claim below can be checked in the
              code.
            </p>
          </div>
          <Platform projects={r.projects} />

          {/* Printed CVs can't use the diagram, so print gets a plain list instead. */}
          <ul className="print-only print-projects">
            {r.projects.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong> ({p.repo.replace('https://', '')}): {p.what}
              </li>
            ))}
          </ul>
        </section>

        <section id="experience" className="section" aria-labelledby="experience-title">
          <div className="section-head">
            <h2 id="experience-title">Experience</h2>
          </div>
          <ol className="timeline">
            {r.experience.map((role) => (
              <li key={role.company} className="role">
                <p className="role-dates">
                  <time dateTime={role.start}>{formatMonth(role.start)}</time>
                  {' – '}
                  {role.end ? <time dateTime={role.end}>{formatMonth(role.end)}</time> : 'present'}
                </p>
                <div className="role-body">
                  <h3>
                    {role.company}
                    <span className="role-title">{role.title}</span>
                  </h3>
                  {role.summary && <p className="role-summary">{role.summary}</p>}
                  {role.work.map((w, i) => (
                    <div key={w.name ?? i} className="engagement">
                      {w.name && <h4>{w.name}</h4>}
                      {w.context && <p className="engagement-context">{w.context}</p>}
                      <ul>
                        {w.points.map((pt) => (
                          <li key={pt}>{stripEmphasis(pt)}</li>
                        ))}
                      </ul>
                      {w.link && (
                        <a className="engagement-link" href={w.link.href}>
                          {w.link.label}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="skills" className="section" aria-labelledby="skills-title">
          <div className="section-head">
            <h2 id="skills-title">Skills</h2>
          </div>
          <dl className="skills">
            {r.skills.map((g) => (
              <div key={g.name} className="skill-group">
                <dt>{g.name}</dt>
                <dd>{g.items.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="approach" className="section" aria-labelledby="approach-title">
          <div className="section-head">
            <h2 id="approach-title">How I work</h2>
          </div>
          <div className="principles">
            {r.principles.map((p) => (
              <div key={p.title} className="principle">
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
          <dl className="facts">
            <div>
              <dt>Education</dt>
              <dd>
                {r.education.school}, {r.education.detail} ({r.education.start}–{r.education.end})
              </dd>
            </div>
            {r.languages.map((l) => (
              <div key={l.name}>
                <dt>{l.name}</dt>
                <dd>{l.detail ? `${l.level}. ${l.detail}` : l.level}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="contact" className="section contact" aria-labelledby="contact-title">
          <h2 id="contact-title">Let’s talk</h2>
          <p>
            {r.availability}. Email is the quickest way to reach me; I work in {r.timezone}.
          </p>
          <a className="contact-email" href={`mailto:${r.email}`}>
            {r.email}
          </a>
          <p className="contact-links">
            <a href={`/${r.cvPdf}`} download={r.cvPdf}>
              Download CV (PDF)
            </a>
            <a href={r.links.github}>GitHub</a>
            <a href={r.links.linkedin}>LinkedIn</a>
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          This site is React and TypeScript, rendered to static HTML at build time and deployed to GitHub
          Pages by GitHub Actions. <a href={`${r.links.github}/truongtankhanh.github.io`}>Read the source</a>.
        </p>
        <p>
          Last built <time dateTime={BUILT}>{BUILT}</time>.
        </p>
      </footer>
    </>
  );
}
