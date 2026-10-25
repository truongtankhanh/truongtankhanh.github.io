// Writes the Lighthouse result of a CI run as Markdown, for the job summary of the `quality` job:
//   node scripts/lighthouse-summary.js >> "$GITHUB_STEP_SUMMARY"
// It reads the reports Lighthouse CI left in .lighthouseci/ (lhr-*.json, and assertion-results.json once the
// budgets were checked) and lists, for each page, the scores of the median run and every budget that failed.
// REPORT_URL, when set, is the link to the artefact with the full HTML reports. No dependency, no network.
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../.lighthouseci/', import.meta.url));

async function readJson(name) {
  try {
    return JSON.parse(await readFile(`${dir}${name}`, 'utf8'));
  } catch {
    return undefined;
  }
}

const names = await readdir(dir).catch(() => []);
const reports = [];
for (const name of names.filter((n) => /^lhr-.*\.json$/.test(n))) {
  const lhr = await readJson(name);
  if (lhr?.categories) reports.push(lhr);
}

const link = process.env.REPORT_URL
  ? `[Download the full Lighthouse reports](${process.env.REPORT_URL}) (HTML, one per run).`
  : 'The full reports are in the artefact `lighthouse-report` of this run.';

const lines = ['## Lighthouse', ''];
if (reports.length === 0) {
  lines.push('No Lighthouse report was produced: see the log of the step that runs `lhci autorun`.');
} else {
  const byUrl = new Map();
  for (const lhr of reports) {
    const url = lhr.finalDisplayedUrl ?? lhr.finalUrl ?? lhr.requestedUrl;
    byUrl.set(url, [...(byUrl.get(url) ?? []), lhr]);
  }
  const score = (lhr, id) =>
    lhr.categories[id]?.score == null ? '–' : Math.round(lhr.categories[id].score * 100);
  const metric = (lhr, id, unit, digits) => {
    const value = lhr.audits?.[id]?.numericValue;
    return value == null
      ? '–'
      : `${(value / (unit === 's' ? 1000 : 1)).toFixed(digits)}${unit === 's' ? ' s' : ''}`;
  };

  lines.push(
    'Median run of each page (by performance score).',
    '',
    '| Page | Runs | Performance | Accessibility | Best practices | SEO | LCP | CLS |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  );
  for (const [url, runs] of byUrl) {
    const sorted = [...runs].sort(
      (a, b) => (a.categories.performance?.score ?? 0) - (b.categories.performance?.score ?? 0),
    );
    const median = sorted[Math.floor(sorted.length / 2)];
    const path = new URL(url).pathname;
    lines.push(
      `| \`${path}\` | ${runs.length} | ${score(median, 'performance')} | ${score(median, 'accessibility')} | ${score(median, 'best-practices')} | ${score(median, 'seo')} | ${metric(median, 'largest-contentful-paint', 's', 2)} | ${metric(median, 'cumulative-layout-shift', '', 3)} |`,
    );
  }

  const results = await readJson('assertion-results.json');
  const failed = Array.isArray(results) ? results.filter((r) => r.passed === false) : [];
  lines.push('');
  if (!Array.isArray(results)) {
    lines.push('The budgets were not checked: see the log of the step that runs `lhci autorun`.');
  } else if (failed.length === 0) {
    lines.push('Every budget passed.');
  } else {
    lines.push(
      '### Budgets that failed',
      '',
      '| Page | Budget | Expected | Got |',
      '| --- | --- | --- | --- |',
    );
    for (const f of failed) {
      const path = f.url ? new URL(f.url).pathname : '–';
      lines.push(
        `| \`${path}\` | ${f.auditId ?? f.name} | ${f.operator ?? ''} ${f.expected} | ${f.actual} |`,
      );
    }
  }
}
lines.push('', link);
console.log(lines.join('\n'));
