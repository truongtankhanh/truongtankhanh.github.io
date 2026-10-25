import { App } from './App';
import { CaseStudy } from './components/CaseStudy';
import { NotFound } from './components/NotFound';
import { PrintCv } from './components/PrintCv';
import { resume } from './content/resume';
import { CV_PATH, NOT_FOUND_PATH, routes } from './routes';

/** The page served at `path`. A path with no route throws, so a bad link fails the build instead of the visitor. */
export function Page({ path }: { path: string }) {
  if (!routes(resume).some((route) => route.path === path)) throw new Error(`No page at ${path}`);
  if (path === '/') return <App />;
  if (path === CV_PATH) return <PrintCv resume={resume} />;
  if (path === NOT_FOUND_PATH) return <NotFound resume={resume} />;
  const project = resume.projects.find((p) => p.caseStudy && `/work/${p.caseStudy.slug}/` === path);
  if (project) return <CaseStudy resume={resume} project={project} />;
  throw new Error(`No component for ${path}`);
}
