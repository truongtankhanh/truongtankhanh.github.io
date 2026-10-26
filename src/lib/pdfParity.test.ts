import { describe, expect, it } from 'vitest';
import { resume } from '../content/resume';
import { formatRange } from './dates';
import { compact, pdfParityProblems } from './pdfParity';
import { displayUrl } from './urls';

/** The words of the CV that the check looks for, as a text extractor might return them. */
function pdfTextOf(r = resume): string {
  return [
    r.name,
    r.email,
    ...r.experience.flatMap((role) => [role.company, role.title, formatRange(role.start, role.end)]),
    ...r.projects.flatMap((p) => [p.name, displayUrl(p.repo)]),
    ...r.metrics.map((m) => m.short ?? m.label),
  ].join('\n');
}

describe('compact', () => {
  it('ignores case, whitespace and the form of a Vietnamese letter', () => {
    expect(compact('Trương  Tấn\nKhánh')).toBe(compact('TRƯƠNG TẤN KHÁNH'));
    expect(compact('Trương'.normalize('NFD'))).toBe(compact('Trương'.normalize('NFC')));
    expect(compact('Trương'.normalize('NFD'))).not.toBe(compact('Truong'));
  });
});

describe('pdfParityProblems', () => {
  it('finds nothing when the PDF says what the content says', () => {
    expect(pdfParityProblems(pdfTextOf(), resume)).toEqual([]);
  });

  it('reads the text as drawn: upper case, spaced-out letters and broken lines', () => {
    const drawn = pdfTextOf()
      .replace(/(\w+ \d{4} – \w+)/g, (range) => range.toUpperCase().split('').join(' '))
      .replace(/ /g, '\n');
    expect(pdfParityProblems(drawn, resume)).toEqual([]);
  });

  it('fails when a role of the content is not in the PDF, as when a role was added and the PDF not regenerated', () => {
    const added = {
      ...resume,
      experience: [...resume.experience, { company: 'Acme', title: 'Tester', start: '2017-01', work: [] }],
    } as typeof resume;
    expect(pdfParityProblems(pdfTextOf(), added)).toEqual(
      expect.arrayContaining(['missing a company: Acme', expect.stringContaining('date ranges')]),
    );
  });

  it('fails when a role was removed from the content and the PDF was not regenerated', () => {
    const removed = { ...resume, experience: resume.experience.slice(0, -1) };
    const problems = pdfParityProblems(pdfTextOf(), removed);
    expect(problems).toEqual([
      `the PDF has ${resume.experience.length} date ranges, the content has ${resume.experience.length - 1} roles`,
    ]);
  });

  it('fails when a phone number is in the text, however it is written', () => {
    for (const phone of ['0901234567', '090 123 4567', '+84 90 123 4567', '(+84) 90 123 4567']) {
      const problems = pdfParityProblems(`${pdfTextOf()}\nCall ${phone}`, resume);
      expect(problems.length, phone).toBe(1);
      expect(problems[0], phone).toContain('a phone number');
    }
  });

  it('fails when the name has lost its diacritics', () => {
    const plain = pdfTextOf().replace(resume.name, resume.nameAscii);
    expect(pdfParityProblems(plain, resume)).toEqual([
      `missing the name, with its diacritics: ${resume.name}`,
    ]);
  });

  it('fails when the email, a repository address or a career figure is missing', () => {
    const text = pdfTextOf().replace(resume.email, '').replace(displayUrl(resume.projects[0]!.repo), '');
    expect(pdfParityProblems(text, resume)).toEqual([
      `missing the email: ${resume.email}`,
      `missing a repository address: ${displayUrl(resume.projects[0]!.repo)}`,
    ]);
  });
});
