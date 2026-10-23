// Renders the app to HTML at build time and writes it into dist/index.html, so the page is
// complete without JavaScript (fast first paint, readable by crawlers and ATS tools).
// React then hydrates the same markup for the interactive parts.
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const template = await readFile(`${root}dist/index.html`, 'utf8');
const { render } = await import(`${root}dist-ssr/entry-server.js`);

const marker = '<!--app-html-->';
if (!template.includes(marker)) throw new Error(`dist/index.html has no ${marker} marker`);

await writeFile(`${root}dist/index.html`, template.replace(marker, render()));
await rm(`${root}dist-ssr`, { recursive: true, force: true });
console.log('prerendered dist/index.html');
