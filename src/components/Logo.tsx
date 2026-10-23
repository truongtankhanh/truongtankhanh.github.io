import { useId } from 'react';

export type LogoVariant = 'dark' | 'light' | 'mono';

type Stop = [offset: number, color: string];

interface Finish {
  plate: Stop[];
  rim: Stop[];
  silver: Stop[];
  gold: Stop[];
  aqua: Stop[];
  sun: Stop[];
  shadow: number;
  highlight: number;
}

// Values come from docs/design/v1/brand/logo-mark-on-{dark,light}.svg.
const FINISH: Record<'dark' | 'light', Finish> = {
  dark: {
    plate: [
      [0, '#355788'],
      [1, '#102a52'],
    ],
    rim: [
      [0, '#ffffff'],
      [1, '#7d92b2'],
    ],
    silver: [
      [0, '#ffffff'],
      [0.5, '#dbe6f5'],
      [1, '#9db2d0'],
    ],
    gold: [
      [0, '#a97f22'],
      [0.55, '#e3bf6b'],
      [1, '#fff2c4'],
    ],
    aqua: [
      [0, '#dcf5ff'],
      [0.5, '#7fd0ff'],
      [1, '#3b91d2'],
    ],
    sun: [
      [0, '#fff2c4'],
      [0.6, '#e3bf6b'],
      [1, '#a97f22'],
    ],
    shadow: 0.62,
    highlight: 0.6,
  },
  light: {
    plate: [
      [0, '#f6f9fd'],
      [1, '#c9d6e8'],
    ],
    rim: [
      [0, '#ffffff'],
      [1, '#7b8fae'],
    ],
    silver: [
      [0, '#4a6285'],
      [0.5, '#1d3558'],
      [1, '#0b1b33'],
    ],
    gold: [
      [0, '#7a5712'],
      [0.55, '#b58a2f'],
      [1, '#e7c46a'],
    ],
    aqua: [
      [0, '#5b9be0'],
      [0.5, '#1b4f9c'],
      [1, '#123a78'],
    ],
    sun: [
      [0, '#e7c46a'],
      [0.6, '#b58a2f'],
      [1, '#7a5712'],
    ],
    shadow: 0.3,
    highlight: 0.5,
  },
};

const PLATE = 'M12 6H46L58 18V52a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6Z';
const BAR = 'M12 16.2C15.5 13 21 13 27 16S38.5 19 42 15.8';
const STEM = 'M27 16V46';
const RAY = 'M27 34L43.6 22.8';
const LEG = 'M27 34L35 40.5C38 43 40 45.5 43 45.5S47.5 43 51 44.5';

function stops(list: Stop[]) {
  return list.map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />);
}

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  /** Accessible name. Leave it out when the mark sits beside the name, so it is hidden from assistive tech. */
  label?: string;
}

/** The TK monogram (brief, "Logo"). The metallic variants carry their own gradients and shadow filter. */
export function Logo({ variant = 'dark', className, label }: LogoProps) {
  // useId output holds characters that are awkward inside url(#...), and two marks on one page must not share ids.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const };
  const svg = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 64 64',
    className,
    overflow: 'visible',
    ...a11y,
  };

  if (variant === 'mono') {
    return (
      <svg {...svg}>
        <path d={PLATE} fill="none" stroke="currentColor" strokeWidth="1.6" />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
          <path d={BAR} strokeWidth="4.2" />
          <path d={STEM} strokeWidth="4.2" />
          <path d={RAY} strokeWidth="3.8" />
          <path d={LEG} strokeWidth="3.8" />
        </g>
        <circle cx="46.8" cy="20.2" r="3.2" fill="currentColor" />
      </svg>
    );
  }

  const f = FINISH[variant];
  const id = (name: string) => `${uid}-${name}`;
  const ref = (name: string) => `url(#${id(name)})`;
  // User-space units: the stem is a zero-width line, and a bounding-box gradient would not paint it.
  const vertical = (name: string, y1: number, y2: number, list: Stop[]) => (
    <linearGradient id={id(name)} gradientUnits="userSpaceOnUse" x1="0" y1={y1} x2="0" y2={y2}>
      {stops(list)}
    </linearGradient>
  );

  return (
    <svg {...svg}>
      <defs>
        {vertical('plate', 6, 58, f.plate)}
        <linearGradient id={id('rim')} gradientUnits="userSpaceOnUse" x1="6" y1="6" x2="58" y2="58">
          {stops(f.rim)}
        </linearGradient>
        {vertical('silver', 12, 48, f.silver)}
        <linearGradient id={id('gold')} gradientUnits="userSpaceOnUse" x1="27" y1="36" x2="44" y2="21">
          {stops(f.gold)}
        </linearGradient>
        <linearGradient id={id('aqua')} gradientUnits="userSpaceOnUse" x1="27" y1="33" x2="51" y2="47">
          {stops(f.aqua)}
        </linearGradient>
        <radialGradient id={id('sun')} gradientUnits="userSpaceOnUse" cx="45.8" cy="19.1" r="4.6">
          {stops(f.sun)}
        </radialGradient>
        <filter id={id('shadow')} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="1.8" stdDeviation="0.9" floodColor="#000" floodOpacity={f.shadow} />
        </filter>
      </defs>
      <path d={PLATE} fill={ref('plate')} stroke={ref('rim')} strokeWidth="1.8" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" filter={ref('shadow')}>
        <path d={BAR} stroke={ref('silver')} strokeWidth="4.2" />
        <path d={STEM} stroke={ref('silver')} strokeWidth="4.2" />
        <path d={RAY} stroke={ref('gold')} strokeWidth="3.8" />
        <path d={LEG} stroke={ref('aqua')} strokeWidth="3.8" />
        <circle cx="46.8" cy="20.2" r="3.2" fill={ref('sun')} stroke="none" />
      </g>
      <g
        fill="none"
        strokeLinecap="round"
        stroke="#fff"
        strokeOpacity={f.highlight}
        strokeWidth="1"
        transform="translate(-0.5 -0.9)"
      >
        <path d={BAR} />
        <path d={STEM} />
        <path d={RAY} strokeOpacity={f.highlight * 0.8} />
      </g>
    </svg>
  );
}
