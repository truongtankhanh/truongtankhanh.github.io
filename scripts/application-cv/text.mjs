// The small text rules the Word edition shares with the site. The site's own versions are TypeScript modules the
// generator cannot import, so they are repeated here and `text.test.ts` runs both on the same input.

const MARK = '**';

/** `src/lib/emphasis.ts`: splits a bullet at its `**key phrases**`; throws on an unbalanced or empty marker. */
export function emphasis(text) {
  const pieces = text.split(MARK);
  if (pieces.length % 2 === 0) throw new Error(`Unbalanced ${MARK} in: ${text}`);
  const parts = [];
  pieces.forEach((piece, i) => {
    const strong = i % 2 === 1;
    if (strong && piece.trim() === '') throw new Error(`Empty ${MARK}${MARK} in: ${text}`);
    if (piece !== '') parts.push({ text: piece, strong });
  });
  return parts;
}

/** `src/lib/urls.ts`: a link as people read it, with no protocol, no "www." and no trailing slash. */
export function displayUrl(href) {
  return href
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `src/lib/dates.ts`: "Apr 2024" from `2024-04`. */
export function formatMonth(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  const month = Number(match?.[2]);
  if (!match || month < 1 || month > 12) throw new Error(`Not a YYYY-MM month: ${value}`);
  return `${MONTHS[month - 1]} ${match[1]}`;
}

/**
 * `src/lib/dates.ts`: "Apr 2024 – Present", or "Jul 2020 – Feb 2024". The site writes "present" in lower case; the Word
 * edition follows V1-20.3 and capitalises it, the only difference.
 */
export function formatRange(start, end) {
  return `${formatMonth(start)} – ${end ? formatMonth(end) : 'Present'}`;
}
