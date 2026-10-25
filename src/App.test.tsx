import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { App } from './App';

const html = () => renderToString(<App />);

describe('App', () => {
  it('has one h1 and the sections in order: work, experience, skills, how I work, contact', () => {
    const markup = html();
    expect(markup.match(/<h1[ >]/g)).toHaveLength(1);
    const ids = ['work', 'experience', 'skills', 'approach', 'contact'].map((id) =>
      markup.indexOf(`<section id="${id}"`),
    );
    for (const i of ids) expect(i).toBeGreaterThan(-1);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });

  it('ends with the contact band: there is no footer, build date or technology line', () => {
    const markup = html();
    expect(markup).not.toContain('<footer');
    expect(markup).not.toContain('Last built');
    expect(markup).not.toContain('Read the source');
    expect(markup.trimEnd().endsWith('</main></div>')).toBe(true);
  });
});
