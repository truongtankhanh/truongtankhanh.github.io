// Renders the app to HTML at build time and writes one file per route into dist/ (dist/index.html,
// dist/work/<slug>/index.html, ...), so every page is complete without JavaScript (fast first paint,
// readable by crawlers and ATS tools). React then hydrates the same markup for the interactive parts.
// The page head (title, description, canonical, Open Graph, JSON-LD), sitemap.xml and robots.txt are
// generated from the same content file and the same route list.
import { copyFile, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const template = await readFile(`${root}dist/index.html`, 'utf8');
const { cvFile, pages, render, seoFiles } = await import(`${root}dist-ssr/entry-server.js`);
const cv = cvFile();

// The template's <title> is the fallback for `pnpm dev`; each page head brings its own.
const bare = template.replace(/\s*<title>[\s\S]*?<\/title>/, '');
const count = (html, pattern) => (html.match(pattern) ?? []).length;

/** `/work/x/` is written as `dist/work/x/index.html`; a path with a file name, such as `/404.html`, as itself. */
const fileOf = (path) => (path.endsWith('/') ? `${path}index.html` : path);

const written = [];
for (const route of pages()) {
  const file = fileOf(route.path);
  const { html: body, head } = render(route.path);
  let html = bare;
  for (const [marker, value] of Object.entries({ '<!--app-html-->': body, '<!--app-head-->': head })) {
    if (!html.includes(marker)) throw new Error(`dist/index.html has no ${marker} marker`);
    html = html.replace(marker, () => value);
  }

  if (count(html, /<title>/g) !== 1) throw new Error(`dist${file} must have exactly one <title>`);
  // A noindex page (the 404 page) has no canonical, because the server already answers 404.
  const canonicals = route.noindex ? 0 : 1;
  if (count(html, /rel="canonical"/g) !== canonicals) {
    throw new Error(`dist${file} must have ${canonicals} canonical link(s)`);
  }
  if (/<!--app-/.test(html)) throw new Error(`dist${file} still has a marker`);
  // The 404 page is served at any depth (/a/b/c), where a relative URL would break; every page keeps to the same rule.
  const relative = html.match(/\s(?:href|src)="(?![/#]|[a-z][a-z0-9+.-]*:)[^"]*"/gi);
  if (relative) throw new Error(`dist${file} has a relative URL: ${relative.join(' ')}`);

  // The CV link follows the file: a build with the PDF links it from the home page, and a build without it links
  // it from nowhere, so the site never offers a download that returns 404.
  const linksCv = html.includes(`href="${cv.pdf}"`);
  if (!cv.published && linksCv) throw new Error(`dist${file} links ${cv.pdf}, but this build has no PDF`);
  if (cv.published && route.path === '/' && !linksCv) throw new Error(`dist${file} does not link ${cv.pdf}`);

  await mkdir(dirname(`${root}dist${file}`), { recursive: true });
  await writeFile(`${root}dist${file}`, html);
  written.push(`dist${file}`);
}

// The PDF was printed by `pnpm build:pdf` from an earlier build of the same pages; it ships next to index.html.
if (cv.published) {
  await copyFile(`${root}dist-pdf/${cv.fileName}`, `${root}dist/${cv.fileName}`);
  written.push(`dist/${cv.fileName}`);
}

const lastmod = new Date().toISOString().slice(0, 10);
for (const [name, content] of Object.entries(seoFiles(lastmod))) {
  await writeFile(`${root}dist/${name}`, content);
}

await rm(`${root}dist-ssr`, { recursive: true, force: true });
console.log(`prerendered ${written.join(', ')}, sitemap.xml and robots.txt`);
