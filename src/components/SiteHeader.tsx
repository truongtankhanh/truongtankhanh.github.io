import { useEffect, useRef, useState } from 'react';
import { resume } from '../content/resume';
import { Logo } from './Logo';

type Theme = 'light' | 'dark';

const SECTIONS = [
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'approach', label: 'How I work' },
  { id: 'contact', label: 'Contact' },
];

const MOON = 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z';
const SUN =
  'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4';
const DOWNLOAD = 'M12 3v12m0 0-4-4m4 4 4-4M4 21h16';
const MENU = 'M4 7h16M4 12h16M4 17h16';
const CLOSE = 'M6 6l12 12M18 6 6 18';

function currentTheme(): Theme {
  const saved = document.documentElement.dataset.theme;
  if (saved === 'light' || saved === 'dark') return saved;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function Icon({ path }: { path: string }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export function SiteHeader() {
  // Unknown until hydration: the server can't know the visitor's theme.
  const [theme, setTheme] = useState<Theme | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => setTheme(currentTheme()), []);

  // Highlight the section the reader is in.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // Escape closes the menu and hands focus back to the button that opened it.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false);
      menuButton.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const toggleTheme = () => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Private mode or blocked storage: the choice simply lasts for this visit.
    }
    setTheme(next);
  };

  // Set the tab straight away so it doesn't wait for the observer while the page scrolls there.
  const pick = (id: string) => {
    setActive(id);
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="header-row">
        <a className="site-name" href="#top">
          {/* The plate carries its own colours, so the dark variant reads on both themes. */}
          <Logo variant="dark" className="brand-mark" />
          <span className="brand-text">
            <span className="brand-name" lang="vi">
              {resume.name}
            </span>
            <span className="brand-role">{resume.headline}</span>
          </span>
        </a>
        <nav aria-label="Sections">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={active === s.id ? 'location' : undefined}
              onClick={() => pick(s.id)}
            >
              {s.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="icon-button theme-button"
            onClick={toggleTheme}
            aria-label="Switch colour theme"
          >
            <Icon path={theme === 'dark' ? SUN : MOON} />
          </button>
          {resume.cv.published && (
            <a
              className="btn btn-primary btn-small btn-on-band"
              href={resume.cv.pdf}
              download={resume.cv.fileName}
              aria-label="Download CV"
            >
              <Icon path={DOWNLOAD} />
              <span>Download CV</span>
            </a>
          )}
          <button
            ref={menuButton}
            type="button"
            className="icon-button menu-button"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon path={menuOpen ? CLOSE : MENU} />
          </button>
        </div>
      </div>
      {/* A div, not a second nav: the tab-group styles are written for `.site-header nav` and must not reach this. */}
      <div
        id="site-menu"
        className={menuOpen ? 'site-menu open' : 'site-menu'}
        role="navigation"
        aria-label="Menu"
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={active === s.id ? 'location' : undefined}
            onClick={() => pick(s.id)}
          >
            {s.label}
          </a>
        ))}
        <button type="button" className="menu-theme" onClick={toggleTheme}>
          <Icon path={theme === 'dark' ? SUN : MOON} />
          Switch colour theme
        </button>
      </div>
    </header>
  );
}
