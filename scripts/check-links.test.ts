import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./check-links.js', import.meta.url));

let dist: string;
beforeEach(() => {
  dist = mkdtempSync(join(tmpdir(), 'check-links-'));
});
afterEach(() => rmSync(dist, { recursive: true, force: true }));

/** Writes a file of the fake site, creating its folders. */
function put(path: string, content: string) {
  mkdirSync(dirname(join(dist, path)), { recursive: true });
  writeFileSync(join(dist, path), content);
}

/** A page with the given body; `extraHead` goes in its head. */
const page = (body: string, extraHead = '') =>
  `<!doctype html><html lang="en"><head><title>T</title>${extraHead}</head><body>${body}</body></html>`;

/** A small site whose links all work. */
function goodSite() {
  put(
    'index.html',
    page(
      '<a href="#top">Top</a><a href="#work">Work</a><a href="/cv/">CV</a><a href="/work/a/#run">Run</a><a href="/">Home</a>' +
        '<a href="/Truong.pdf" download>PDF</a><img src="/images/x.webp" srcset="/images/x.webp 1x, /images/x2.webp 2x"><section id="work"></section>',
      '<link rel="canonical" href="https://example.test/" /><script type="application/ld+json">{"a":"<a href=\\"/nope\\">"}</script>',
    ),
  );
  put(
    'cv/index.html',
    page(
      '<a href="../">Back</a><a href="/#work">Work</a><a href="mailto:a@b.c">Mail</a><a href="https://github.com/x">GH</a>',
    ),
  );
  put('work/a/index.html', page('<section id="run"></section><a href="b/">Next</a>'));
  put('work/a/b/index.html', page('<a href="/work/a/">Prev</a>'));
  put('404.html', page('<a href="/">Home</a><a href="/#work">Work</a>'));
  put('Truong.pdf', '%PDF-');
  put('images/x.webp', 'x');
  put('images/x2.webp', 'x');
  put('sitemap.xml', '<urlset><url><loc>https://example.test/</loc></url></urlset>');
}

function check() {
  const run = spawnSync('node', [script, dist], { encoding: 'utf8' });
  return { status: run.status, out: run.stdout, err: run.stderr };
}

describe('scripts/check-links.js', () => {
  it('passes a site whose links all work, and lists the external ones without fetching them', () => {
    goodSite();
    const { status, out } = check();
    expect(status).toBe(0);
    expect(out).toContain('https://github.com/x');
    expect(out).toMatch(/checked \d+ internal links in 5 pages: none broken/);
  });

  it('ignores what is inside a script, so JSON-LD with markup in it is not read as links', () => {
    goodSite();
    expect(check().err).toBe('');
  });

  it('fails on a link to a page that does not exist, and names the page and the link', () => {
    goodSite();
    put('cv/index.html', page('<a href="/work/missing/">Gone</a>'));
    const { status, err } = check();
    expect(status).toBe(1);
    expect(err).toContain('1 broken link');
    expect(err).toContain('dist/cv/index.html');
    expect(err).toContain('href="/work/missing/"');
  });

  it('fails on a missing image, script or file', () => {
    goodSite();
    put(
      'index.html',
      page('<img src="/images/gone.webp"><script src="/assets/gone.js"></script><a href="/Gone.pdf">x</a>'),
    );
    const { status, err } = check();
    expect(status).toBe(1);
    expect(err).toContain('src="/images/gone.webp"');
    expect(err).toContain('src="/assets/gone.js"');
    expect(err).toContain('href="/Gone.pdf"');
  });

  it('fails on an image listed in a srcset that does not exist', () => {
    goodSite();
    put('index.html', page('<img src="/images/x.webp" srcset="/images/x.webp 1x, /images/x3.webp 2x">'));
    expect(check().err).toContain('srcset="/images/x3.webp"');
  });

  it('fails on a fragment that the page does not have, on the same page and on another', () => {
    goodSite();
    put('index.html', page('<a href="#nowhere">x</a><a href="/work/a/#nowhere">y</a>'));
    const { status, err } = check();
    expect(status).toBe(1);
    expect(err).toContain('href="#nowhere"');
    expect(err).toContain('href="/work/a/#nowhere"');
    expect(err).toContain('points at #nowhere');
  });

  it('resolves a relative link against the page that holds it', () => {
    goodSite();
    put(
      'work/a/index.html',
      page(
        '<section id="run"></section><a href="../../cv/">CV</a><a href="b/">Next</a><a href="c/">Missing</a>',
      ),
    );
    const { err } = check();
    expect(err).toContain('1 broken link');
    expect(err).toContain('href="c/"');
  });

  it('checks an absolute URL on the site’s own origin, such as the canonical link', () => {
    goodSite();
    put('cv/index.html', page('', '<link rel="canonical" href="https://example.test/cv/gone/" />'));
    const { status, err } = check();
    expect(status).toBe(1);
    expect(err).toContain('href="https://example.test/cv/gone/"');
  });

  it('exits with 1 for every broken link and says how many', () => {
    goodSite();
    put(
      'index.html',
      page('<section id="work"></section><a href="/a/">1</a><a href="/b/">2</a><a href="/c/">3</a>'),
    );
    expect(check().err).toContain('3 broken links');
  });
});
