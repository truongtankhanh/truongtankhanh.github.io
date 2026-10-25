import { useId } from 'react';
import type { Resume } from '../content/types';
import { HeroSun, HeroWaves } from './Hero';
import { Icon } from './Icon';
import { SiteHeader } from './SiteHeader';

/** The twelve ticks around the 0, 30° apart, from radius 78 to 92 of a 200 px box. Fixed, so server and browser print the same. */
const ZERO_RAYS = [
  [178.0, 100.0, 192.0, 100.0],
  [167.5, 139.0, 179.7, 146.0],
  [139.0, 167.5, 146.0, 179.7],
  [100.0, 178.0, 100.0, 192.0],
  [61.0, 167.5, 54.0, 179.7],
  [32.5, 139.0, 20.3, 146.0],
  [22.0, 100.0, 8.0, 100.0],
  [32.5, 61.0, 20.3, 54.0],
  [61.0, 32.5, 54.0, 20.3],
  [100.0, 22.0, 100.0, 8.0],
  [139.0, 32.5, 146.0, 20.3],
  [167.5, 61.0, 179.7, 54.0],
] as const;

/** The sun of the logo, standing in for the 0 of "404": a silver ring, twelve gold ticks and a gold disc. */
function SunZero() {
  // useId output holds characters that are awkward inside url(#...).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ring = `${uid}-ring`;
  const disc = `${uid}-disc`;
  return (
    <svg className="nf-zero" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={ring} gradientUnits="userSpaceOnUse" x1="20" y1="20" x2="180" y2="180">
          <stop offset="0" style={{ stopColor: 'var(--silver-1)' }} />
          <stop offset="0.45" style={{ stopColor: 'var(--silver-2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--silver-3)' }} />
        </linearGradient>
        <radialGradient id={disc} gradientUnits="userSpaceOnUse" cx="100" cy="100" r="40">
          <stop offset="0" style={{ stopColor: 'var(--gold-hi)' }} />
          <stop offset="0.6" style={{ stopColor: 'var(--gold)' }} />
          <stop offset="1" style={{ stopColor: 'var(--gold-lo)' }} />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="66" fill="none" stroke={`url(#${ring})`} strokeWidth="22" />
      <g className="nf-zero-rays">
        {ZERO_RAYS.map(([x1, y1, x2, y2]) => (
          <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
      <circle cx="100" cy="100" r="30" fill={`url(#${disc})`} />
    </svg>
  );
}

/**
 * The page GitHub Pages serves, with status 404, for an address that has no page. It can appear at any depth
 * (`/a/b/c`), so every URL on it is root-relative. Its words are interface text; they say nothing about the owner.
 */
export function NotFound({ resume: r }: { resume: Resume }) {
  const firstYear = Math.min(...r.experience.map((role) => Number(role.start.slice(0, 4))));
  const tiles = [
    { href: '/#work', name: 'Work', note: `${r.projects.length} public repositories` },
    { href: '/#experience', name: 'Experience', note: `Roles since ${firstYear}` },
    { href: '/#approach', name: 'How I work', note: 'Scope and principles' },
    { href: '/#contact', name: 'Contact', note: 'Email, GitHub, LinkedIn' },
  ];

  return (
    <div className="site">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <SiteHeader home={false} />

      <main id="main">
        <section className="hero not-found" aria-labelledby="not-found-title">
          <HeroSun />
          <HeroWaves />
          <div className="hero-inner">
            <p className="hero-meta">Error 404 · Page not found</p>
            <p className="nf-code" aria-hidden="true">
              <b className="text-silver">4</b>
              <SunZero />
              <b className="text-silver">4</b>
            </p>
            <h1 id="not-found-title" className="text-silver">
              This page isn’t here.
            </h1>
            <p className="intro">
              The link may be old or mistyped. Everything on this site is on the home page
              {r.cv.published ? ', and the CV is one click away.' : '.'}
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary btn-on-band" href="/">
                <Icon name="home" />
                Back to home
              </a>
              {/* Absent while the PDF is not shipped (V1-14.2), so the page never offers a dead download. */}
              {r.cv.published && (
                <a className="btn btn-on-band" href={r.cv.pdf} download={r.cv.fileName}>
                  <Icon name="download" />
                  Download CV (PDF)
                </a>
              )}
            </div>
            <ul className="nf-links" aria-label="Sections of the home page">
              {tiles.map((tile) => (
                <li key={tile.href}>
                  <a className="tile" href={tile.href}>
                    <span className="tile-name">{tile.name}</span>
                    <span className="tile-note">{tile.note}</span>
                    <Icon name="arrowUpRight" className="icon tile-icon" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
