import { Packer, type Document } from 'docx';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** The XML parts of a packed document that the checks read. */
export interface DocxParts {
  body: string;
  /** Empty when the document has no footer. */
  footer: string;
  rels: string;
  /** The properties of the file: title, author, description. */
  core: string;
  /** The picture files; the folder's own entry in the zip is not one. */
  media: string[];
}

/** Packs `document` and reads its parts, as `unpackBuffer` does. */
export async function unpack(document: Document): Promise<DocxParts> {
  return unpackBuffer(await Packer.toBuffer(document));
}

/** Reads the parts of a .docx with `unzip`, which the tests need on the machine. */
export function unpackBuffer(docx: Buffer): DocxParts {
  const dir = mkdtempSync(join(tmpdir(), 'application-cv-'));
  try {
    const file = join(dir, 'cv.docx');
    writeFileSync(file, docx);
    const part = (name: string, optional = false) => {
      const out = spawnSync('unzip', ['-p', file, name], { encoding: 'utf8' });
      if (out.status !== 0) {
        if (optional) return '';
        throw new Error(`cannot read ${name}: ${out.stderr}`);
      }
      return out.stdout;
    };
    const listing = spawnSync('unzip', ['-Z1', file], { encoding: 'utf8' }).stdout.split('\n');
    return {
      body: part('word/document.xml'),
      footer: part('word/footer1.xml', true),
      rels: part('word/_rels/document.xml.rels'),
      core: part('docProps/core.xml'),
      media: listing.filter((name) => name.startsWith('word/media/') && !name.endsWith('/')),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The XML of each paragraph, in order. */
export const paragraphXml = (xml: string) => [...xml.matchAll(/<w:p[ >].*?<\/w:p>/gs)].map((p) => p[0]);

/** The text of each paragraph, in order, without the markup. */
export const paragraphs = (xml: string) =>
  paragraphXml(xml).map((p) => [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((t) => t[1]).join(''));

/** The style id of a paragraph's XML, if it has one. */
export const styleOf = (paragraph: string) => /<w:pStyle w:val="([^"]+)"/.exec(paragraph)?.[1];
