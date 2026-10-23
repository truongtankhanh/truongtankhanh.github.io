// Renders the app to HTML at build time and writes it into dist/index.html, so the page is
// complete without JavaScript (fast first paint, readable by crawlers and ATS tools).
// React then hydrates the same markup for the interactive parts. It also writes the head
// extras (JSON-LD), sitemap.xml and robots.txt, all generated from the same content file.
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const template = await readFile(`${root}dist/index.html`, 'utf8');
const { render, renderHead, seoFiles } = await import(`${root}dist-ssr/entry-server.js`);

const markers = { '<!--app-html-->': render(), '<!--app-head-->': renderHead() };
let html = template;
for (const [marker, value] of Object.entries(markers)) {
  if (!html.includes(marker)) throw new Error(`dist/index.html has no ${marker} marker`);
  html = html.replace(marker, () => value);
}
await writeFile(`${root}dist/index.html`, html);

const lastmod = new Date().toISOString().slice(0, 10);
for (const [name, content] of Object.entries(seoFiles(lastmod))) {
  await writeFile(`${root}dist/${name}`, content);
}

await rm(`${root}dist-ssr`, { recursive: true, force: true });
console.log('prerendered dist/index.html, sitemap.xml and robots.txt');
