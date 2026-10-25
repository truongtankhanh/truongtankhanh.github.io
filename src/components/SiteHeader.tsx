import { useEffect, useRef, useState } from 'react';
import { resume } from '../content/resume';
import { Icon } from './Icon';
import { Logo } from './Logo';

type Theme = 'light' | 'dark';

const SECTIONS = [
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'approach', label: 'How I work' },
  { id: 'contact', label: 'Contact' },
];

function currentTheme(): Theme {
  const saved = document.documentElement.dataset.theme;
  if (saved === 'light' || saved === 'dark') return saved;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * `home` is false on a page that is not the home page (the 404 page, which can be served at any depth): the section
 * links and the lockup then point at `/#work` and `/` instead of an anchor of the page itself.
 */
export function SiteHeader({ home = true }: { home?: boolean }) {
  const sectionHref = (id: string) => (home ? `#${id}` : `/#${id}`);
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
        <a className="site-name" href={home ? '#top' : '/'}>
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
              href={sectionHref(s.id)}
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
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          {resume.cv.published && (
            <a
              className="btn btn-primary btn-small btn-on-band"
              href={resume.cv.pdf}
              download={resume.cv.fileName}
              aria-label="Download CV"
            >
              <Icon name="download" />
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
            <Icon name={menuOpen ? 'close' : 'menu'} />
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
            href={sectionHref(s.id)}
            aria-current={active === s.id ? 'location' : undefined}
            onClick={() => pick(s.id)}
          >
            {s.label}
          </a>
        ))}
        <button type="button" className="menu-theme" onClick={toggleTheme}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          Switch colour theme
        </button>
      </div>
    </header>
  );
}
