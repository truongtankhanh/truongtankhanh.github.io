import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/800.css';

import { resume } from './content/resume';
import { Contact } from './components/Contact';
import { Experience } from './components/Experience';
import { Hero } from './components/Hero';
import { Leadership } from './components/Leadership';
import { SiteHeader } from './components/SiteHeader';
import { Skills } from './components/Skills';
import { Work } from './components/Work';

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

          <Skills groups={r.skills} coreStack={r.coreStack} coreStackNote={r.coreStackNote} />

          <Leadership
            leadership={r.leadership}
            principles={r.principles}
            education={r.education}
            languages={r.languages}
          />
        </div>

        <Contact resume={r} />
      </main>
    </div>
  );
}
