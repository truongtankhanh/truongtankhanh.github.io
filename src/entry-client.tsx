import { hydrateRoot } from 'react-dom/client';
import { Page } from './Page';
import './styles.css';

// Hydrate the page the server rendered for this URL.
hydrateRoot(document.getElementById('root')!, <Page path={location.pathname} />);
