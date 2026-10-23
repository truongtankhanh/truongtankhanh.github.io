import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const publicFile = (name: string) => new URL(`../../public/${name}`, import.meta.url);
const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

const FILES = [
  'favicon.svg',
  'favicon.ico',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'site.webmanifest',
];

/** Width and height from the IHDR chunk of a PNG. */
function pngSize(name: string) {
  const bytes = readFileSync(publicFile(name));
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe('favicon set', () => {
  it('has all six files in public/', () => {
    for (const name of FILES) expect(existsSync(publicFile(name)), name).toBe(true);
  });

  it('is linked from index.html with root-relative URLs', () => {
    for (const href of ['/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/site.webmanifest']) {
      expect(indexHtml).toContain(`href="${href}"`);
    }
    expect(indexHtml.match(/<meta name="theme-color"/g)).toHaveLength(2);
    expect(indexHtml).not.toMatch(/rel="icon" href="(?!\/)/);
  });

  it('has a real multi-size ICO with 16, 32 and 48 px images', () => {
    const ico = readFileSync(publicFile('favicon.ico'));
    expect([ico.readUInt16LE(0), ico.readUInt16LE(2)]).toEqual([0, 1]);
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico[6 + 16 * i] || 256);
    expect(sizes).toEqual([16, 32, 48]);
  });

  it('has PNG icons of the sizes the manifest and iOS expect', () => {
    expect(pngSize('apple-touch-icon.png')).toEqual({ width: 180, height: 180 });
    expect(pngSize('icon-192.png')).toEqual({ width: 192, height: 192 });
    expect(pngSize('icon-512.png')).toEqual({ width: 512, height: 512 });
  });

  it('lists in the manifest only icons that exist', () => {
    const manifest = JSON.parse(readFileSync(publicFile('site.webmanifest'), 'utf8')) as {
      icons: { src: string }[];
    };
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const { src } of manifest.icons)
      expect(existsSync(publicFile(src.replace(/^\//, ''))), src).toBe(true);
  });
});
