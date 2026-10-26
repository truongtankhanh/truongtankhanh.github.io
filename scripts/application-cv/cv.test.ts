import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Document } from 'docx';
import { resume } from '../../src/content/resume';
import type { Resume } from '../../src/content/types';
import { paragraphs, unpack } from './docxParts';

interface Cv {
  PHONE_ON_REQUEST: string;
  PROPERTIES: { title: string; creator: string; description: string };
  fileName(resume: Pick<Resume, 'cvPdf'>): string;
  buildCvDocument(input: { resume: Resume; phone: string; logo: Buffer }): Document;
}
interface Header {
  LOGO_FILE: URL;
}

// The modules are plain JavaScript; computed specifiers keep the type checker out of them.
const cvPath = './cv.mjs';
const headerPath = './header.mjs';
const { PHONE_ON_REQUEST, PROPERTIES, fileName, buildCvDocument } = (await import(cvPath)) as Cv;
const { LOGO_FILE } = (await import(headerPath)) as Header;

// Put together here and not written out, so no number appears in this file.
const NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9].join('');
const PHONE = ['0', NINE.slice(0, 2), NINE.slice(2, 5), NINE.slice(5)].join(' ');
const logo = readFileSync(LOGO_FILE);

describe('fileName', () => {
  it('is the name of the public CV with .docx', () => {
    expect(fileName(resume)).toBe('Truong_Tan_Khanh_CV.docx');
  });

  it.each(['CV', 'Trương_CV.pdf', 'a b.pdf', ''])(
    'refuses %j, which cannot make a safe .docx name',
    (cvPdf) => {
      expect(() => fileName({ cvPdf })).toThrow(/Cannot make a \.docx name/);
    },
  );
});

describe('buildCvDocument', () => {
  it('sets the title, the author and a description of the file', async () => {
    const { core } = await unpack(buildCvDocument({ resume, phone: PHONE, logo }));
    expect(core).toContain(`<dc:title>${PROPERTIES.title}</dc:title>`);
    expect(core).toContain(`<dc:creator>${PROPERTIES.creator}</dc:creator>`);
    expect(core).toContain(`<dc:description>${PROPERTIES.description}</dc:description>`);
    expect(PROPERTIES.title).toBe('Truong Tan Khanh, CV');
  });

  it('puts the first-page block, the body and a footer in one section, with the logo as the only picture', async () => {
    const doc = await unpack(buildCvDocument({ resume, phone: PHONE, logo }));
    const text = paragraphs(doc.body);
    const english = resume.languages.at(-1)!;
    expect(text[1]).toBe(resume.name);
    expect(text[2]).toBe(resume.headline);
    expect(text).toContain('Summary');
    expect(text.at(-1)).toBe(`${english.name} · ${english.level}. ${english.detail}`);
    expect(doc.footer).toContain('NUMPAGES');
    expect(doc.media).toHaveLength(1);
    expect(doc.body.match(/<w:sectPr>/g)).toHaveLength(1);
  });

  it('writes the phone number once in the document and not in the footer', async () => {
    const doc = await unpack(buildCvDocument({ resume, phone: PHONE, logo }));
    expect(doc.body.split(PHONE)).toHaveLength(2);
    expect(doc.footer).not.toContain(PHONE);
    expect(doc.core).not.toContain(PHONE);
  });

  it('writes the placeholder in a dry run, and no number', async () => {
    const doc = await unpack(buildCvDocument({ resume, phone: PHONE_ON_REQUEST, logo }));
    expect(paragraphs(doc.body)[3]).toMatch(/^\(phone on request\) · /);
    expect(doc.body).not.toContain(NINE);
    expect(doc.rels).not.toContain('tel:');
  });
});
