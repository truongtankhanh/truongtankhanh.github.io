import type { Metric } from '../content/types';

/** The career figures as a strip: value, label and where the figure comes from. It renders nothing without data. */
export function Metrics({ metrics }: { metrics: Metric[] }) {
  if (metrics.length === 0) return null;
  return (
    <ul className="metrics" aria-label="Career at a glance">
      {metrics.map((m) => (
        <li key={`${m.value} ${m.label}`}>
          <span className="metric-value text-silver">{m.value}</span>
          <span className="metric-label">{m.label}</span>
          <small className="metric-source">{m.source}</small>
        </li>
      ))}
    </ul>
  );
}
