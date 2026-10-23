import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resume } from '../content/resume';
import { headTags, homeMeta } from './seo';

const image = new URL('../../public/images/og.png', import.meta.url);
const brandPng = new URL('../../docs/design/v1/brand/og-image.png', import.meta.url);
const brandHtml = new URL('../../docs/design/v1/brand/og-image.html', import.meta.url);
const SENTENCE = 'Operations platforms, IoT and live video, from architecture to production.';

describe('share image', () => {
  it('is 1200 x 630 and under 200 KB', () => {
    const png = readFileSync(image);
    expect(png.subarray(1, 4).toString('latin1')).toBe('PNG');
    expect({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) }).toEqual({
      width: 1200,
      height: 630,
    });
    expect(statSync(image).size).toBeLessThan(200 * 1024);
  });

  it('is the exported brand image', () => {
    expect(readFileSync(image).equals(readFileSync(brandPng))).toBe(true);
  });

  it('is the file the og:image tag points to, by its absolute URL', () => {
    const head = headTags(resume, homeMeta(resume));
    expect(head).toContain(`<meta property="og:image" content="${resume.siteUrl}images/og.png" />`);
    expect(existsSync(image)).toBe(true);
  });

  it('has alt text that reads the name, the role and the sentence on the image', () => {
    const alt = homeMeta(resume).image.alt;
    expect(alt).toBe(`${resume.name}, ${resume.headline}. ${SENTENCE}`);
    expect(headTags(resume, homeMeta(resume))).toContain(`content="${alt}"`);
  });

  // The PNG is drawn from this file. If a word below stops matching the content, the image is stale: regenerate it.
  it('is drawn from words that are in the content', () => {
    const source = readFileSync(brandHtml, 'utf8');
    const figures = ['7+', '3+', '~50'].map((value) => resume.metrics.find((m) => m.value === value)!);
    expect(figures.every(Boolean)).toBe(true);
    const expected = [
      resume.name,
      resume.headline,
      SENTENCE,
      `${resume.location} · ${resume.timezone}`,
      resume.siteUrl.replace(/^https:\/\//, '').replace(/\/$/, ''),
      ...figures.flatMap((m) => [m.value, m.label]),
    ];
    for (const text of expected) expect(source, text).toContain(text);
  });
});
