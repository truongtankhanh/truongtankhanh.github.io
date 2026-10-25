import { beforeAll, describe, expect, it } from 'vitest';
import {
  Document,
  Paragraph,
  TextRun,
  type Footer,
  type IPropertiesOptions,
  type ISectionOptions,
} from 'docx';
import { readFileSync } from 'node:fs';
import { resume } from '../../src/content/resume';
import { paragraphs, unpack } from './docxParts';

interface Builders {
  LOGO_FILE: URL;
  buildFirstBlock(input: { resume: typeof resume; phone: string; logo: Buffer }): Paragraph[];
  buildFooter(input: { resume: typeof resume }): Footer;
}
interface Sheet {
  PAGE: NonNullable<ISectionOptions['properties']>['page'];
  STYLE: { heading1: string };
  createStyles(): Pick<IPropertiesOptions, 'styles' | 'numbering'>;
}

// The modules are plain JavaScript; computed specifiers keep the type checker out of them.
const headerPath = './header.mjs';
const stylesPath = './styles.mjs';
const { LOGO_FILE, buildFirstBlock, buildFooter } = (await import(headerPath)) as Builders;
const { PAGE, STYLE, createStyles } = (await import(stylesPath)) as Sheet;

/** Not a Vietnamese number and not a real one: a number set aside for fiction. */
const PHONE = '+1 555 0100';
const logo = readFileSync(LOGO_FILE);

/** Packs a document with the block, the footer and one heading, and returns the XML parts the checks read. */
function build(phone = PHONE) {
  return unpack(
    new Document({
      ...createStyles(),
      sections: [
        {
          properties: { page: PAGE },
          footers: { default: buildFooter({ resume }) },
          children: [
            ...buildFirstBlock({ resume, phone, logo }),
            new Paragraph({ style: STYLE.heading1, children: [new TextRun('Summary')] }),
          ],
        },
      ],
    }),
  );
}

let doc: Awaited<ReturnType<typeof build>>;
beforeAll(async () => {
  doc = await build();
});

describe('first-page block', () => {
  it('reads location, name, role and contact line, in that order', () => {
    const [location, name, role, contact] = paragraphs(doc.body);
    expect(location).toBe(`— ${resume.location} · ${resume.timezone}`);
    expect(name).toBe(resume.name);
    expect(role).toBe(resume.headline);
    expect(contact).toBe(
      [
        PHONE,
        resume.email,
        'truongtankhanh.github.io',
        'github.com/truongtankhanh',
        'linkedin.com/in/truongtankhanh',
      ].join(' · '),
    );
    expect(paragraphs(doc.body)[4]).toBe('Summary');
  });

  it('puts the blocks in the named styles', () => {
    const styles = [...doc.body.matchAll(/<w:pStyle w:val="([^"]+)"/g)].map((m) => m[1]);
    expect(styles).toEqual(['Caption', 'Title', 'Subtitle', 'Contact', 'Heading1']);
  });

  it('marks the name as Vietnamese and the location line with the gold mark style', () => {
    expect(doc.body).toMatch(new RegExp(`<w:lang w:val="vi-VN"/></w:rPr><w:t[^>]*>${resume.name}</w:t>`));
    expect(doc.body).toContain('<w:rStyle w:val="Mark"/>');
  });

  it('makes every item of the contact line a real link, the email a mailto and the phone a tel', () => {
    const links = [...doc.rels.matchAll(/Target="([^"]+)"[^>]*TargetMode="External"/g)].map((m) => m[1]);
    expect(links).toEqual(
      expect.arrayContaining([
        'tel:+15550100',
        `mailto:${resume.email}`,
        resume.siteUrl,
        resume.links.github,
        resume.links.linkedin,
      ]),
    );
    expect(doc.body.match(/<w:hyperlink /g)).toHaveLength(5);
    expect(doc.body.match(/<w:rStyle w:val="Hyperlink"\/>/g)).toHaveLength(5);
  });

  it('leaves the dry run phone as plain text', async () => {
    const dry = await build('(phone on request)');
    expect(paragraphs(dry.body)[3]).toMatch(/^\(phone on request\) · /);
    expect(dry.body.match(/<w:hyperlink /g)).toHaveLength(4);
  });

  it('refuses an empty phone number', () => {
    expect(() => buildFirstBlock({ resume, phone: ' ', logo })).toThrow(/phone number/);
  });

  it('holds the monogram as the only picture: inline, with alt text, after the name through a tab', () => {
    expect(doc.media).toHaveLength(1);
    expect(doc.body.match(/<w:drawing>/g)).toHaveLength(1);
    expect(doc.body).toContain('<wp:inline ');
    expect(doc.body).not.toContain('<wp:anchor');
    expect(doc.body).toContain(`descr="${resume.nameAscii} monogram"`);
    expect(doc.body).toMatch(/<w:tab\/><\/w:r><w:r><w:drawing>/);
    // 14 mm: 504825 EMU is 53 px at 96 dpi.
    expect(doc.body).toContain('<wp:extent cx="504825" cy="504825"/>');
  });

  it('has no table, no text box and no direct colour or size', () => {
    for (const xml of [doc.body, doc.footer]) {
      expect(xml).not.toMatch(/<w:tbl>|<w:txbxContent|<w:pict|<mc:AlternateContent/);
      expect(xml).not.toMatch(/<w:(?:color|sz|szCs) /);
    }
  });

  it('writes the phone number once, in the document body and nowhere in the footer', () => {
    expect(doc.body.split(PHONE)).toHaveLength(2);
    expect(doc.footer).not.toContain(PHONE);
    expect(doc.footer).not.toContain('555');
  });
});

describe('footer', () => {
  it('has the name and role at the left and the page count at the right', () => {
    expect(paragraphs(doc.footer)).toEqual([`${resume.name} · ${resume.headline}page  of `]);
    expect(doc.footer).toContain('<w:pStyle w:val="Footer"/>');
    expect(doc.footer).toMatch(/<w:tab\/>/);
  });

  it('counts the pages with Word fields, so the numbers follow the length', () => {
    expect(doc.footer).toMatch(/<w:instrText[^>]*>PAGE<\/w:instrText>/);
    expect(doc.footer).toMatch(/<w:instrText[^>]*>NUMPAGES<\/w:instrText>/);
  });
});
