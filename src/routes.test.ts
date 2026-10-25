import { describe, expect, it } from 'vitest';
import { resume } from './content/resume';
import { CV_PATH, NOT_FOUND_PATH, routeFor, routes } from './routes';

describe('routes', () => {
  it('lists the home page first and the 404 page last, as noindex', () => {
    const list = routes(resume);
    expect(list[0]).toEqual({ path: '/' });
    expect(list.at(-1)).toEqual({ path: NOT_FOUND_PATH, noindex: true });
  });

  it('marks only the CV page and the 404 page noindex', () => {
    expect(routes(resume).filter((route) => route.noindex)).toEqual([
      { path: CV_PATH, noindex: true },
      { path: NOT_FOUND_PATH, noindex: true },
    ]);
  });
});

describe('routeFor', () => {
  it('keeps the address of a page that exists', () => {
    expect(routeFor(resume, '/')).toBe('/');
  });

  it('reads /index.html as the page of its folder', () => {
    expect(routeFor(resume, '/index.html')).toBe('/');
  });

  it('sends an address with no page to the 404 page, at any depth', () => {
    for (const pathname of ['/nope/', '/a/b/c', '/work/missing/', '/cv']) {
      expect(routeFor(resume, pathname), pathname).toBe(NOT_FOUND_PATH);
    }
  });

  it('keeps the address of the CV page, with or without its index.html', () => {
    expect(routeFor(resume, CV_PATH)).toBe(CV_PATH);
    expect(routeFor(resume, '/cv/index.html')).toBe(CV_PATH);
  });

  it('keeps the 404 address itself', () => {
    expect(routeFor(resume, NOT_FOUND_PATH)).toBe(NOT_FOUND_PATH);
  });
});
