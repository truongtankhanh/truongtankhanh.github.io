import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./check-assets.js', import.meta.url));

let dist: string;
beforeEach(() => {
  dist = mkdtempSync(join(tmpdir(), 'check-assets-'));
});
afterEach(() => rmSync(dist, { recursive: true, force: true }));

function put(path: string, content: string | Buffer) {
  mkdirSync(dirname(join(dist, path)), { recursive: true });
  writeFileSync(join(dist, path), content);
}

/** A PNG signature and IHDR chunk with the given size, padded to `bytes`; enough for the check, which reads the header. */
function png(width: number, height: number, bytes = 64): Buffer {
  const file = Buffer.alloc(bytes);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(file);
  file.writeUInt32BE(13, 8);
  file.write('IHDR', 12, 'ascii');
  file.writeUInt32BE(width, 16);
  file.writeUInt32BE(height, 20);
  return file;
}

const page = (body: string, head = '') =>
  `<!doctype html><html lang="en"><head><title>T</title>${head}</head><body>${body}</body></html>`;

/** A site that passes every rule. */
function goodSite() {
  put('index.html', page('<main>Hello</main>'));
  put(
    '404.html',
    page(
      '<a href="/">Home</a><a href="/#work">Work</a><a href="https://github.com/x">GH</a><img src="/images/x.webp">',
      '<meta name="robots" content="noindex" />',
    ),
  );
  put('favicon.svg', '<svg/>');
  put('favicon.ico', 'ico');
  put('apple-touch-icon.png', png(180, 180));
  put('icon-192.png', png(192, 192));
  put('icon-512.png', png(512, 512));
  put('images/og.png', png(1200, 630));
  put('site.webmanifest', JSON.stringify({ icons: [{ src: '/icon-192.png' }, { src: '/icon-512.png' }] }));
  put(
    'sitemap.xml',
    '<urlset><url><loc>https://example.test/</loc></url><url><loc>https://example.test/work/a/</loc></url></urlset>',
  );
}

function check() {
  const run = spawnSync('node', [script, dist], { encoding: 'utf8' });
  return { status: run.status, out: run.stdout, err: run.stderr };
}

describe('scripts/check-assets.js', () => {
  it('passes a site that has every file and follows every rule', () => {
    goodSite();
    const { status, err } = check();
    expect(err).toBe('');
    expect(status).toBe(0);
  });

  it('fails when an icon of the set is missing, naming the file and the rule', () => {
    goodSite();
    rmSync(join(dist, 'apple-touch-icon.png'));
    const { status, err } = check();
    expect(status).toBe(1);
    expect(err).toContain('dist/apple-touch-icon.png: is required and is missing');
  });

  it('fails when the manifest lists an icon that is not in dist/', () => {
    goodSite();
    put('site.webmanifest', JSON.stringify({ icons: [{ src: '/icon-192.png' }, { src: '/icon-1024.png' }] }));
    expect(check().err).toContain(
      'dist/site.webmanifest: lists an icon that is not in dist/ (/icon-1024.png)',
    );
  });

  it('fails when the share image is not 1200 x 630, reading the size from the PNG header', () => {
    goodSite();
    put('images/og.png', png(1200, 628));
    expect(check().err).toContain('dist/images/og.png: must be 1200 x 630 (it is 1200 x 628)');
  });

  it('fails when the share image is over 200 KB', () => {
    goodSite();
    put('images/og.png', png(1200, 630, 201 * 1024));
    expect(check().err).toContain('dist/images/og.png: must be under 200 KB (it is 201 KB)');
  });

  it('fails when the share image is not a PNG', () => {
    goodSite();
    put('images/og.png', 'not a png, but long enough to have a header to read');
    expect(check().err).toContain('dist/images/og.png: is not a PNG file');
  });

  it('fails on a relative URL on the 404 page, which is served at any depth', () => {
    goodSite();
    put(
      '404.html',
      page(
        '<a href="work/a/">x</a><img src="images/x.webp"><link href="style.css">',
        '<meta name="robots" content="noindex" />',
      ),
    );
    const { status, err } = check();
    expect(status).toBe(1);
    expect(err).toContain('dist/404.html: must have no relative href or src (href="work/a/")');
    expect(err).toContain('(src="images/x.webp")');
    expect(err).toContain('(href="style.css")');
  });

  it('fails when the 404 page is not noindex', () => {
    goodSite();
    put('404.html', page('<a href="/">Home</a>'));
    expect(check().err).toContain('dist/404.html: must have <meta name="robots" content="noindex" />');
  });

  it('fails when the sitemap lists the CV page or the 404 page', () => {
    goodSite();
    put(
      'sitemap.xml',
      '<urlset><url><loc>https://example.test/cv/</loc></url><url><loc>https://example.test/404.html</loc></url></urlset>',
    );
    const { err } = check();
    expect(err).toContain('dist/sitemap.xml: must not list /cv/');
    expect(err).toContain('dist/sitemap.xml: must not list /404.html');
  });

  it('fails when a phone number is in the text of a page, however it is written', () => {
    for (const phone of ['0901234567', '090 123 4567', '+84 90 123 4567']) {
      goodSite();
      put('work/a/index.html', page(`<p>Call ${phone} now</p>`));
      const { status, err } = check();
      expect(status, phone).toBe(1);
      expect(err, phone).toContain('dist/work/a/index.html: must not hold a phone number');
    }
  });

  it('fails when a phone number is in the JSON-LD or in an XML file', () => {
    goodSite();
    put(
      'index.html',
      page('<main/>', '<script type="application/ld+json">{"telephone":"+84 90 123 4567"}</script>'),
    );
    put('feed.xml', '<a>0901234567</a>');
    const { err } = check();
    expect(err).toContain('dist/index.html: must not hold a phone number');
    expect(err).toContain('dist/feed.xml: must not hold a phone number');
  });

  it('does not read the numbers of an icon path as a phone number', () => {
    goodSite();
    put(
      'work/a/index.html',
      page(
        '<svg viewBox="0 0 24 24"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-4-9 3 3 5-6"></path><polygon points="0 1 0 0 0 1 0 0 0 1 0"/></svg>',
      ),
    );
    expect(check().status).toBe(0);
  });

  it('reads the same phone patterns as src/lib/privacy.ts', () => {
    const privacy = readFileSync(new URL('../src/lib/privacy.ts', import.meta.url), 'utf8');
    const checker = readFileSync(script, 'utf8');
    for (const pattern of [/const INTERNATIONAL = (\/.*\/);/, /const NATIONAL = (\/.*\/);/]) {
      expect(privacy.match(pattern)?.[1], String(pattern)).toBeDefined();
      expect(checker.match(pattern)?.[1]).toBe(privacy.match(pattern)![1]);
    }
  });

  it('reports every problem, with the count', () => {
    goodSite();
    rmSync(join(dist, 'icon-512.png'));
    rmSync(join(dist, 'favicon.ico'));
    expect(check().err).toMatch(/^[3-9] problems:/);
  });
});
