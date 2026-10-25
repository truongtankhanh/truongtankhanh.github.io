import { hydrateRoot } from 'react-dom/client';
import { Page } from './Page';
import { resume } from './content/resume';
import { routeFor } from './routes';
import './styles.css';

// Hydrate the page the server rendered for this URL; an address with no page of its own was answered with 404.html.
hydrateRoot(document.getElementById('root')!, <Page path={routeFor(resume, location.pathname)} />);
