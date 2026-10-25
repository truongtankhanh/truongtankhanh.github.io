import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { App } from './App';
import { Page } from './Page';

describe('Page', () => {
  it('renders the home page at "/" exactly as App does', () => {
    expect(renderToString(<Page path="/" />)).toBe(renderToString(<App />));
  });

  it('throws for a path that is not a route', () => {
    expect(() => renderToString(<Page path="/nope/" />)).toThrow('No page at /nope/');
  });
});
