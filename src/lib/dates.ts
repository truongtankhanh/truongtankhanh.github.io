import type { Month } from '../content/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function parseMonth(value: Month): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  const month = Number(match?.[2]);
  if (!match || month < 1 || month > 12) throw new Error(`Not a YYYY-MM month: ${value}`);
  return { year: Number(match[1]), month };
}

export function formatMonth(value: Month): string {
  const { year, month } = parseMonth(value);
  return `${MONTHS[month - 1]} ${year}`;
}

/** "April 2024", for running text. */
export function formatMonthLong(value: Month): string {
  const { year, month } = parseMonth(value);
  return `${LONG_MONTHS[month - 1]} ${year}`;
}

/** "Apr 2024 – present", or "Jul 2020 – Feb 2024". */
export function formatRange(start: Month, end?: Month): string {
  return `${formatMonth(start)} – ${end ? formatMonth(end) : 'present'}`;
}
