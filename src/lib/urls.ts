/** A link as people read it: no protocol, no "www." and no trailing slash. */
export function displayUrl(href: string): string {
  return href
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}
