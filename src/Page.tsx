import { App } from './App';
import { NotFound } from './components/NotFound';
import { resume } from './content/resume';
import { NOT_FOUND_PATH, routes } from './routes';

/** The page served at `path`. A path with no route throws, so a bad link fails the build instead of the visitor. */
export function Page({ path }: { path: string }) {
  if (!routes(resume).some((route) => route.path === path)) throw new Error(`No page at ${path}`);
  if (path === '/') return <App />;
  if (path === NOT_FOUND_PATH) return <NotFound resume={resume} />;
  // Case-study pages (`/work/<slug>/`) get their component with V1-10.1.
  throw new Error(`No component for ${path}`);
}
