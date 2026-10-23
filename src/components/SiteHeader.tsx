import { useEffect, useState } from 'react';
import { resume } from '../content/resume';

type Theme = 'light' | 'dark';

const SECTIONS = [
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
];

function currentTheme(): Theme {
  const saved = document.documentElement.dataset.theme;
  if (saved === 'light' || saved === 'dark') return saved;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function SiteHeader() {
  // Unknown until hydration: the server can't know the visitor's theme.
  const [theme, setTheme] = useState<Theme | null>(null);
  const [active, setActive] = useState<string | null>(null);

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

  return (
    <header className="site-header">
      <a className="site-name" href="#main" lang="vi">
        Trương Tấn Khánh
      </a>
      <nav aria-label="Sections">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? 'location' : undefined}>
            {s.label}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        <button type="button" className="icon-button" onClick={toggleTheme} aria-label="Switch colour theme">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {theme === 'dark' ? (
              <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
            ) : (
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
            )}
          </svg>
        </button>
        <a className="button button-small" href={`/${resume.cvPdf}`} download={resume.cvPdf}>
          Download CV
        </a>
      </div>
    </header>
  );
}
