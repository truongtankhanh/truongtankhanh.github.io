/**
 * Contour lines of an imaginary highland, drawn once at build time. A nod to Lâm Đồng's
 * plateau and to the map work in the projects; purely decorative.
 */
const RINGS = 11;
const POINTS = 72;
const CX = 300;
const CY = 300;

function ring(level: number): string {
  const base = 40 + level * 24;
  const pts: string[] = [];
  for (let i = 0; i < POINTS; i++) {
    const a = (i / POINTS) * Math.PI * 2;
    // A few low-frequency waves give the rings an uneven, terrain-like outline; the phase drifts
    // with the level so neighbouring lines don't run perfectly parallel.
    const wobble =
      Math.sin(a * 2 + level * 0.35) * (6 + level * 1.6) +
      Math.sin(a * 3 - level * 0.22) * (4 + level * 0.9) +
      Math.cos(a * 5 + level * 0.5) * 2.5;
    const r = base + wobble;
    pts.push(`${(CX + Math.cos(a) * r * 1.15).toFixed(1)},${(CY + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

const paths = Array.from({ length: RINGS }, (_, i) => ring(i));

export function Contours() {
  return (
    <div className="hero-art" aria-hidden="true">
      <svg className="contours" viewBox="0 0 600 600" focusable="false">
        {paths.map((d, i) => (
          <path key={i} d={d} className={i % 5 === 4 ? 'contour contour-index' : 'contour'} />
        ))}
        <circle className="contour-peak" cx={CX + 6} cy={CY - 4} r="5" />
      </svg>
    </div>
  );
}
