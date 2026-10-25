// Checks the internal links of the built site, so a case study, the CV or a renamed section cannot break one
// silently. It reads every dist/**/*.html, resolves each internal `href`, `src`, `srcset` and `poster` (root-relative
// or relative to the page, or absolute on the site's own origin), and asserts that the file exists and, for a `#id` fragment, that the target page has
// that id. External links are listed, not fetched. No dependency; run it after `pnpm build`:
//   node scripts/check-links.js [dist-directory]
// It exits with 1 and names the page and the link of every broken one.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = process.argv[2] ?? fileURLToPath(new URL('../dist/', import.meta.url));
const ORIGIN = 'https://site.invalid';
/** A fragment every browser scrolls to the top for, whether or not an element has that id. */
const TOP = new Set(['', 'top']);

async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(path)));
    else found.push(path);
  }
  return found;
}

const decode = (value) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** The tags of a page without the bodies of its scripts and styles, which may hold text that looks like markup. */
const markupOf = (html) =>
  html.replace(/<!--[\s\S]*?-->/g, '').replace(/(<(script|style)\b[^>]*>)[\s\S]*?(<\/\2>)/gi, '$1$3');

/** The attributes of one start tag, by name. */
function attributes(source) {
  const found = {};
  for (const m of source.matchAll(/([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    found[m[1].toLowerCase()] = decode(m[2] ?? m[3]);
  }
  return found;
}

/** Every link of a page: the attribute it came from and its value. */
function linksOf(html) {
  const links = [];
  for (const tag of markupOf(html).matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const attrs = attributes(tag[2]);
    for (const name of ['href', 'src', 'poster']) {
      if (attrs[name] !== undefined) links.push({ name, value: attrs[name] });
    }
    if (attrs.srcset !== undefined) {
      for (const candidate of attrs.srcset.split(',')) {
        const url = candidate.trim().split(/\s+/)[0];
        if (url) links.push({ name: 'srcset', value: url });
      }
    }
  }
  return links;
}

const idsOf = (html) =>
  new Set(
    [...markupOf(html).matchAll(/\s(?:id|name)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((m) =>
      decode(m[1] ?? m[2]),
    ),
  );

/** `index.html` is `/`, `work/x/index.html` is `/work/x/`, and `404.html` is itself. */
function urlOf(file) {
  const path = `/${file.split(sep).join('/')}`;
  return path.endsWith('/index.html') ? path.slice(0, -'index.html'.length) : path;
}

const files = (await walk(dist)).map((path) => relative(dist, path).split(sep).join('/'));
const present = new Set(files);
const pages = files.filter((file) => file.endsWith('.html'));
const html = new Map(
  await Promise.all(pages.map(async (file) => [file, await readFile(join(dist, file), 'utf8')])),
);
const idCache = new Map();
const idsIn = (file) => {
  if (!idCache.has(file)) idCache.set(file, idsOf(html.get(file)));
  return idCache.get(file);
};

/** The file of `dist/` that a server answers `pathname` with, or undefined. GitHub Pages also serves `/x` for `x/` and `x.html`. */
function fileFor(pathname) {
  const path = decodeURIComponent(pathname).replace(/^\//, '');
  const candidates =
    path === '' || path.endsWith('/') ? [`${path}index.html`] : [path, `${path}/index.html`, `${path}.html`];
  return candidates.find((candidate) => present.has(candidate));
}

// An absolute URL on the site's own origin (the canonical link, say) is checked like any other internal one. The
// origin is the one `sitemap.xml` lists.
const own =
  html.has('index.html') && present.has('sitemap.xml')
    ? /<loc>(https?:\/\/[^/<]+)/.exec(await readFile(join(dist, 'sitemap.xml'), 'utf8'))?.[1]
    : undefined;

const broken = [];
const external = new Map();
let internal = 0;

for (const page of pages) {
  for (const { name, value } of linksOf(html.get(page))) {
    const text = value.trim();
    if (/^(mailto|tel|sms|data|javascript):/i.test(text)) continue;
    let url;
    try {
      url = new URL(text, ORIGIN + urlOf(page));
    } catch {
      broken.push(`dist/${page}: ${name}="${value}" is not a URL`);
      continue;
    }
    if (own && url.origin === own) url = new URL(url.pathname + url.search + url.hash, ORIGIN);
    if (url.origin !== ORIGIN) {
      external.set(url.href, (external.get(url.href) ?? 0) + 1);
      continue;
    }
    internal += 1;
    const target = fileFor(url.pathname);
    if (!target) {
      broken.push(`dist/${page}: ${name}="${value}" has no file (looked for ${url.pathname})`);
      continue;
    }
    const fragment = decodeURIComponent(url.hash.slice(1));
    if (TOP.has(fragment) || !target.endsWith('.html')) continue;
    if (!idsIn(target).has(fragment)) {
      broken.push(
        `dist/${page}: ${name}="${value}" points at #${fragment}, which dist/${target} does not have`,
      );
    }
  }
}

if (external.size > 0) {
  console.log(`External links (not fetched), ${external.size}:`);
  for (const [href, count] of [...external].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`  ${href}${count > 1 ? ` (${count} times)` : ''}`);
  }
}
if (broken.length > 0) {
  console.error(`\n${broken.length} broken link${broken.length === 1 ? '' : 's'}:`);
  for (const line of broken) console.error(`  ${line}`);
  process.exit(1);
}
console.log(`\nchecked ${internal} internal links in ${pages.length} pages: none broken`);
