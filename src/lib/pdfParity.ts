import type { Resume } from '../content/types';
import { formatRange } from './dates';
import { findPhoneNumber } from './privacy';
import { displayUrl } from './urls';

/**
 * Text as the parity check compares it: composed diacritics, lower case and no whitespace. A text extractor returns
 * what the page's CSS drew, not what the markup said: upper-case labels (`text-transform`), a line break in the middle
 * of a phrase, a space between letters that are spaced out (`letter-spacing`), and either form of a Vietnamese letter.
 */
export function compact(text: string): string {
  return text.normalize('NFC').toLowerCase().replace(/\s+/g, '');
}

const MONTH = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\\d{4}';
const DATE_RANGE = new RegExp(`${MONTH}–(?:present|${MONTH})`, 'g');

/**
 * What differs between the text of the CV PDF and `resume`; an empty list is parity. Everything the page prints
 * for a role must be there, a PDF with more roles than the content has is stale, and no phone number may appear.
 */
export function pdfParityProblems(text: string, r: Resume): string[] {
  const problems: string[] = [];
  const haystack = compact(text);
  const expectText = (what: string, value: string) => {
    if (!haystack.includes(compact(value))) problems.push(`missing ${what}: ${value}`);
  };

  expectText('the name, with its diacritics', r.name);
  expectText('the email', r.email);
  for (const role of r.experience) {
    expectText('a company', role.company);
    expectText('a job title', role.title);
    expectText('a date range', formatRange(role.start, role.end));
  }
  for (const project of r.projects) {
    expectText('a project', project.name);
    expectText('a repository address', displayUrl(project.repo));
  }
  for (const metric of r.metrics) expectText('a career figure', metric.label);

  // A role removed from the content but still in a PDF that was not regenerated leaves one range too many.
  const ranges = haystack.match(DATE_RANGE)?.length ?? 0;
  if (ranges !== r.experience.length) {
    problems.push(`the PDF has ${ranges} date ranges, the content has ${r.experience.length} roles`);
  }

  const phone = findPhoneNumber(text) ?? findPhoneNumber(text.replace(/\s+/g, ' '));
  if (phone) problems.push(`a phone number: ${phone}`);
  return problems;
}
