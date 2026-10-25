// Checks the static files and the URL and privacy rules of the built site that a link checker does not cover:
//   - the favicon set, the web manifest and the share image are in dist/, every icon the manifest lists exists, and
//     the share image is 1200 x 630 and under 200 KB (the size is read from the PNG header);
//   - dist/404.html, which GitHub Pages serves at any depth, has no relative `href` or `src` and has `noindex`;
//   - sitemap.xml lists neither /cv/ nor /404.html;
//   - no dist/**/*.html or .xml file holds a phone number.
// No dependency; run it after `pnpm build`:  node scripts/check-assets.js [dist-directory]
// It exits with 1 and names the file and the rule of every problem.
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = process.argv[2] ?? fileURLToPath(new URL('../dist/', import.meta.url));

// Keep in sync with `src/lib/privacy.ts` (a test checks it).
const INTERNATIONAL = /(?:\+|\b00)\s*84/;
const NATIONAL = /\b0(?:[\s.-]?\d){9}\b/;

const REQUIRED = [
  'favicon.svg',
  'favicon.ico',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'site.webmanifest',
  'images/og.png',
];
const SHARE_IMAGE = { path: 'images/og.png', width: 1200, height: 630, maxBytes: 200 * 1024 };

async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(path)));
    else found.push(path);
  }
  return found;
}

const problems = [];
const fail = (file, rule, detail) => problems.push(`dist/${file}: ${rule}${detail ? ` (${detail})` : ''}`);

const sizeOf = (file) =>
  stat(join(dist, file)).then(
    (s) => s.size,
    () => undefined,
  );
const read = (file) => readFile(join(dist, file), 'utf8').catch(() => undefined);

// 1. The files every page head, the manifest and the share tags rely on.
for (const file of REQUIRED) {
  if ((await sizeOf(file)) === undefined) fail(file, 'is required and is missing');
}

// 2. The share image: its size from the PNG header, and its weight.
{
  const { path, width, height, maxBytes } = SHARE_IMAGE;
  const bytes = await readFile(join(dist, path)).catch(() => undefined);
  if (bytes) {
    const isPng =
      bytes.length >= 24 &&
      bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (!isPng) {
      fail(path, 'is not a PNG file');
    } else {
      const [w, h] = [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
      if (w !== width || h !== height) fail(path, `must be ${width} x ${height}`, `it is ${w} x ${h}`);
    }
    if (bytes.length > maxBytes) {
      fail(path, `must be under ${maxBytes / 1024} KB`, `it is ${Math.round(bytes.length / 1024)} KB`);
    }
  }
}

// 3. Every icon the manifest lists exists.
{
  const text = await read('site.webmanifest');
  if (text !== undefined) {
    let manifest;
    try {
      manifest = JSON.parse(text);
    } catch {
      fail('site.webmanifest', 'is not valid JSON');
    }
    for (const icon of manifest?.icons ?? []) {
      const path = new URL(icon.src, 'https://site.invalid/site.webmanifest').pathname.replace(/^\//, '');
      if ((await sizeOf(decodeURIComponent(path))) === undefined) {
        fail('site.webmanifest', 'lists an icon that is not in dist/', icon.src);
      }
    }
    if (!manifest?.icons?.length) fail('site.webmanifest', 'must list at least one icon');
  }
}

// 4. The 404 page is served at any depth (/a/b/c), so every URL on it is root-relative or absolute; and it is noindex.
{
  const html = await read('404.html');
  if (html !== undefined) {
    const markup = html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/(<(script|style)\b[^>]*>)[\s\S]*?(<\/\2>)/gi, '$1$3');
    for (const m of markup.matchAll(/\s(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
      const value = m[2] ?? m[3];
      if (!/^(?:\/|#|[a-z][a-z0-9+.-]*:)/i.test(value.trim())) {
        fail('404.html', 'must have no relative href or src', `${m[1].toLowerCase()}="${value}"`);
      }
    }
    if (!/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html))
      fail('404.html', 'must have <meta name="robots" content="noindex" />');
  }
}

// 5. The sitemap lists only pages that should be found.
{
  const xml = await read('sitemap.xml');
  if (xml === undefined) {
    fail('sitemap.xml', 'is required and is missing');
  } else {
    for (const m of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) {
      const { pathname } = new URL(m[1]);
      if (pathname === '/cv/' || pathname === '/404.html')
        fail('sitemap.xml', `must not list ${pathname}`, m[1]);
    }
  }
}

// 6. No phone number in any page or XML file. The geometry of an icon (`d="M12 21a9 9 …"`) is digits and spaces
// and can look like a number, so the values of `d` and `points` are not read; text, JSON-LD and the rest are.
{
  const files = (await walk(dist))
    .map((path) => relative(dist, path).split(sep).join('/'))
    .filter((file) => /\.(html|xml)$/.test(file));
  for (const file of files) {
    const text = (await read(file)).replace(/\s(?:d|points)\s*=\s*(?:"[^"]*"|'[^']*')/g, ' ');
    const phone = INTERNATIONAL.exec(text)?.[0] ?? NATIONAL.exec(text)?.[0];
    if (phone) fail(file, 'must not hold a phone number', `found "${phone}"`);
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
  for (const line of problems) console.error(`  ${line}`);
  process.exit(1);
}
console.log(
  'checked the static files, the manifest, the 404 page, the sitemap and the phone rule: none broken',
);
