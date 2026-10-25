import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { App } from './App';
import { Page } from './Page';

describe('Page', () => {
  it('renders the home page at "/" exactly as App does', () => {
    expect(renderToString(<Page path="/" />)).toBe(renderToString(<App />));
  });

  it('renders the 404 page at /404.html', () => {
    expect(renderToString(<Page path="/404.html" />)).toContain('This page isn’t here.');
  });

  it('renders the Ops Command Center case study at its route', () => {
    const markup = renderToString(<Page path="/work/ops-command-center/" />);
    expect(markup.match(/<h1[ >]/g)).toHaveLength(1);
    expect(markup).toContain('Case study');
    expect(markup).toContain('Ops Command Center');
  });

  it('throws for a path that is not a route', () => {
    expect(() => renderToString(<Page path="/nope/" />)).toThrow('No page at /nope/');
  });
});
