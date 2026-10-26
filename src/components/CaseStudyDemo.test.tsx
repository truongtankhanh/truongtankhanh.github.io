// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { resume } from '../content/resume';
import type { Project, Resume } from '../content/types';
import { CaseStudy } from './CaseStudy';

// The poster of the demo video is not in the prerendered page: the browser would fetch it ahead of the fonts and the
// styles of what is on screen. It is given when the player comes near the screen.

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const demo = resume.projects[0]!.caseStudy!.demo!;
const project: Project = {
  ...resume.projects[0]!,
  caseStudy: { ...resume.projects[0]!.caseStudy!, demo: { ...demo, published: true } },
};
const published: Resume = { ...resume, projects: [project, ...resume.projects.slice(1)] };

/** An `IntersectionObserver` that does nothing until the test says an element is on screen. */
class FakeObserver {
  static all: FakeObserver[] = [];
  disconnected = false;
  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeObserver.all.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
  takeRecords() {
    return [];
  }
}

let root: Root;
let container: HTMLElement;
const original = globalThis.IntersectionObserver;

async function mount() {
  await act(async () => root.render(<CaseStudy resume={published} project={project} />));
}
const video = () => container.querySelector('video')!;
const see = (isIntersecting: boolean) =>
  act(async () => {
    const target = container.querySelector('#demo')!;
    for (const o of FakeObserver.all) {
      o.callback([{ isIntersecting, target } as unknown as IntersectionObserverEntry], o as never);
    }
  });

beforeEach(() => {
  // The header reads the theme from the page, and asks `matchMedia` (which jsdom lacks) only when there is none.
  document.documentElement.dataset.theme = 'light';
  FakeObserver.all = [];
  globalThis.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  delete document.documentElement.dataset.theme;
  globalThis.IntersectionObserver = original;
});

describe('the poster of the demo video', () => {
  it('is not there when the page loads, so the browser fetches nothing for the player', async () => {
    await mount();
    expect(video()).not.toBeNull();
    expect(video().hasAttribute('poster')).toBe(false);
    expect(video().getAttribute('preload')).toBe('none');
  });

  it('is given when the player comes near the screen, and the observer is let go', async () => {
    await mount();
    await see(true);
    expect(video().getAttribute('poster')).toBe(`/${demo.poster}`);
    expect(FakeObserver.all.some((o) => o.disconnected && o.options?.rootMargin === '200px 0px')).toBe(true);
  });

  it('stays off while the player is far from the screen', async () => {
    await mount();
    await see(false);
    expect(video().hasAttribute('poster')).toBe(false);
  });
});
