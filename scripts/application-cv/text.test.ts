import { describe, expect, it } from 'vitest';
import { resume } from '../../src/content/resume';
import { formatMonth, formatRange } from '../../src/lib/dates';
import { emphasis } from '../../src/lib/emphasis';
import { displayUrl } from '../../src/lib/urls';

interface Text {
  emphasis(text: string): { text: string; strong: boolean }[];
  displayUrl(href: string): string;
  formatMonth(value: string): string;
  formatRange(start: string, end?: string): string;
}

// The module is plain JavaScript; a computed specifier keeps the type checker out of it.
const path = './text.mjs';
const word = (await import(path)) as Text;

/** Every bullet and every other string of the content that may carry `**`. */
const marked = [
  'plain text',
  'a **key phrase** in the middle',
  '**the whole line**',
  'two **phrases** and **another**.',
  ...resume.experience.flatMap((role) => role.work.flatMap((work) => work.points)),
];

describe('text rules shared with the site', () => {
  it.each(marked)('splits %s at its ** markers like src/lib/emphasis.ts', (text) => {
    expect(word.emphasis(text)).toEqual(emphasis(text));
  });

  it.each(['**open', 'close**', '** **', 'a ** b'])('refuses %s like src/lib/emphasis.ts', (text) => {
    expect(() => emphasis(text)).toThrow();
    expect(() => word.emphasis(text)).toThrow();
  });

  it.each([
    'https://truongtankhanh.github.io/',
    'https://github.com/truongtankhanh/ops-command-center',
    'https://www.linkedin.com/in/truongtankhanh/',
    'http://example.com',
  ])('shows %s like src/lib/urls.ts', (href) => {
    expect(word.displayUrl(href)).toBe(displayUrl(href));
  });

  it.each(['2018-12', '2020-03', '2024-04', '2026-10'] as const)(
    'writes the month %s like src/lib/dates.ts',
    (month) => {
      expect(word.formatMonth(month)).toBe(formatMonth(month));
    },
  );

  it('writes a closed range like the site and an open one with a capital P', () => {
    expect(word.formatRange('2020-07', '2024-02')).toBe(formatRange('2020-07', '2024-02'));
    expect(word.formatRange('2024-04')).toBe('Apr 2024 – Present');
    expect(word.formatRange('2024-04')).toBe(formatRange('2024-04').replace('present', 'Present'));
  });

  it('refuses a month that is not YYYY-MM', () => {
    expect(() => word.formatMonth('2024-13')).toThrow(/YYYY-MM/);
    expect(() => word.formatMonth('April 2024')).toThrow(/YYYY-MM/);
  });
});
