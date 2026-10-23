// Renders the app to HTML at build time and writes it into dist/index.html, so the page is
// complete without JavaScript (fast first paint, readable by crawlers and ATS tools).
// React then hydrates the same markup for the interactive parts. The page head (title, description,
// canonical, Open Graph, JSON-LD), sitemap.xml and robots.txt are generated from the same content file.
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const template = await readFile(`${root}dist/index.html`, 'utf8');
const { render, seoFiles } = await import(`${root}dist-ssr/entry-server.js`);

const { html: body, head } = render('/');
// The template's <title> is the fallback for `pnpm dev`; the page head brings its own.
let html = template.replace(/\s*<title>[\s\S]*?<\/title>/, '');
for (const [marker, value] of Object.entries({ '<!--app-html-->': body, '<!--app-head-->': head })) {
  if (!html.includes(marker)) throw new Error(`dist/index.html has no ${marker} marker`);
  html = html.replace(marker, () => value);
}

const count = (pattern) => (html.match(pattern) ?? []).length;
if (count(/<title>/g) !== 1) throw new Error('dist/index.html must have exactly one <title>');
if (count(/rel="canonical"/g) !== 1) throw new Error('dist/index.html must have exactly one canonical link');
if (/<!--app-/.test(html)) throw new Error('dist/index.html still has a marker');
await writeFile(`${root}dist/index.html`, html);

const lastmod = new Date().toISOString().slice(0, 10);
for (const [name, content] of Object.entries(seoFiles(lastmod))) {
  await writeFile(`${root}dist/${name}`, content);
}

await rm(`${root}dist-ssr`, { recursive: true, force: true });
console.log('prerendered dist/index.html, sitemap.xml and robots.txt');
