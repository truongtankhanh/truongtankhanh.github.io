import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/800.css';

import { resume } from './content/resume';
import { Experience } from './components/Experience';
import { Hero } from './components/Hero';
import { SiteHeader } from './components/SiteHeader';
import { Work } from './components/Work';

// Fixed at build time (see vite.config.ts) so server and client render the same date.
const BUILT = __BUILD_DATE__;

export function App() {
  const r = resume;
  return (
    // The container for the `@container` queries: the layout follows this box, not the window.
    <div className="site">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main">
        <Hero resume={r} />

        <div className="page">
          <Work projects={r.projects} architecture={r.architecture} />

          <Experience roles={r.experience} />

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
        </div>
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
    </div>
  );
}
