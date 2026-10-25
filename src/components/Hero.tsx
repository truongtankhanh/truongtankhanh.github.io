import type { Resume } from '../content/types';
import { formatMonthLong } from '../lib/dates';
import { EmailLink } from './EmailLink';
import { Icon } from './Icon';
import { HeroStack } from './HeroStack';

const SUN_SIZE = 760;
const SUN_RAYS = 36;

/** Rays alternate long and short. Coordinates are rounded so the server and the browser print the same markup. */
const sunRays = Array.from({ length: SUN_RAYS }, (_, i) => {
  const angle = (i / SUN_RAYS) * Math.PI * 2;
  const inner = 268;
  const outer = inner + (i % 2 === 0 ? 50 : 30);
  const at = (radius: number, axis: (a: number) => number) => Math.round(SUN_SIZE / 2 + radius * axis(angle));
  return {
    x1: at(inner, Math.cos),
    y1: at(inner, Math.sin),
    x2: at(outer, Math.cos),
    y2: at(outer, Math.sin),
  };
});

/** Three thin rings and a crown of rays that turns once in three minutes (the turning is CSS). */
function HeroSun() {
  return (
    <svg className="hero-sun" viewBox={`0 0 ${SUN_SIZE} ${SUN_SIZE}`} aria-hidden="true" focusable="false">
      {[150, 210, 250].map((r) => (
        <circle key={r} cx={SUN_SIZE / 2} cy={SUN_SIZE / 2} r={r} />
      ))}
      {sunRays.map((ray) => (
        <line key={`${ray.x1}-${ray.y1}`} {...ray} />
      ))}
    </svg>
  );
}

/** Two translucent waves drift along the foot of the band; the front one, in the page colour, closes it. */
function HeroWaves() {
  return (
    <div className="hero-waves" aria-hidden="true">
      <svg className="wave-back" viewBox="0 0 2880 64" preserveAspectRatio="none">
        <path d="M0 36 C240 8 480 62 720 36 S1200 8 1440 36 C1680 8 1920 62 2160 36 S2640 8 2880 36 V64 H0Z" />
      </svg>
      <svg className="wave-mid" viewBox="0 0 2880 64" preserveAspectRatio="none">
        <path d="M0 28 C300 58 540 6 720 30 S1180 56 1440 28 C1740 58 1980 6 2160 30 S2620 56 2880 28 V64 H0Z" />
      </svg>
      <svg className="wave-front" viewBox="0 0 1440 64" preserveAspectRatio="none">
        <path d="M0 40 C240 10 480 60 720 36 S1200 14 1440 40 V64 H0Z" />
      </svg>
    </div>
  );
}

export function Hero({ resume: r }: { resume: Resume }) {
  const current = r.experience.find((role) => !role.end);
  const [lead, ...more] = r.intro;

  return (
    <section className="hero" aria-labelledby="name">
      <HeroSun />
      <HeroWaves />
      <div className="hero-inner">
        <div className="hero-grid">
          <div className="hero-text">
            <p className="hero-meta">
              {r.location} · {r.timezone}
            </p>
            <h1 id="name" lang="vi" className="text-silver">
              {r.name}
            </h1>
            <p className="headline text-gold">{r.headline}</p>
            <p className="intro">{lead}</p>
            {/* The lead stays within four lines on screen; the printed CV keeps every paragraph. */}
            {more.map((p) => (
              <p key={p} className="intro print-only">
                {p}
              </p>
            ))}
            <p className="where">
              <span className="where-place">
                {r.location}, {r.timezone}.{' '}
              </span>
              {r.availability}.
            </p>
            <div className="hero-actions">
              <EmailLink
                email={r.email}
                label="Email me"
                copiedLabel="Email copied"
                className="btn btn-primary btn-on-band"
                icon="mail"
              />
              <a className="btn btn-on-band" href={r.cv.pdf} download={r.cv.fileName}>
                <Icon name="download" />
                Download CV (PDF)
              </a>
              <a className="btn btn-on-band" href={r.links.github}>
                GitHub
                <Icon name="arrowUpRight" />
              </a>
              <a className="btn btn-on-band" href={r.links.linkedin}>
                LinkedIn
                <Icon name="arrowUpRight" />
              </a>
            </div>
            <dl className="hero-facts">
              {current && (
                <div>
                  <dt>Currently</dt>
                  <dd className="fact-main">{current.company}</dd>
                  <dd className="fact-sub">
                    {r.currentlyNote} since {formatMonthLong(current.start)}
                  </dd>
                </div>
              )}
              <div>
                <dt>Open source</dt>
                <dd className="fact-main">{r.projects.length} public repositories</dd>
                <dd className="fact-sub">
                  <a className="fact-link" href="#work">
                    See the work
                  </a>
                </dd>
              </div>
            </dl>
          </div>
          <HeroStack layers={r.heroStack} coreStack={r.coreStack} />
        </div>
      </div>
    </section>
  );
}
