import { useRef, useState, type KeyboardEvent } from 'react';
import type { Project, ProjectId } from '../content/types';

/**
 * The five public repositories drawn as the one platform they form: sensors feed the telemetry
 * pipeline, its alerts become incidents in the command center, AWS hosts both, and the
 * decision records and delivery pipelines sit underneath everything. Each repository is a tab;
 * the panel below shows the selected one.
 */

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Edge {
  d: string;
  label: string;
  lx: number;
  ly: number;
}
interface Layout {
  viewBox: string;
  external: { box: Box; label: string }[];
  frame: Box;
  nodes: Record<ProjectId, Box>;
  edges: Edge[];
  /** Paths the moving data packets follow; the first edges of `edges`, joined. */
  flow: string;
}

const WIDE: Layout = {
  viewBox: '0 0 800 330',
  external: [
    { box: { x: 8, y: 74, w: 110, h: 52 }, label: 'Campus sensors' },
    { box: { x: 694, y: 74, w: 98, h: 52 }, label: 'Control room' },
  ],
  frame: { x: 140, y: 14, w: 532, h: 170 },
  nodes: {
    telemetry: { x: 160, y: 56, w: 222, h: 88 },
    occ: { x: 430, y: 56, w: 222, h: 88 },
    aws: { x: 152, y: 2, w: 170, h: 28 },
    adr: { x: 8, y: 206, w: 784, h: 52 },
    pipelines: { x: 8, y: 270, w: 784, h: 52 },
  },
  edges: [
    { d: 'M118 100 H160', label: 'MQTT', lx: 139, ly: 92 },
    { d: 'M382 100 H430', label: 'alerts', lx: 406, ly: 92 },
    { d: 'M652 100 H694', label: 'live', lx: 673, ly: 92 },
  ],
  flow: 'M118 100 H694',
};

const NARROW: Layout = {
  viewBox: '0 0 360 610',
  external: [
    { box: { x: 100, y: 4, w: 160, h: 46 }, label: 'Campus sensors' },
    { box: { x: 100, y: 418, w: 160, h: 46 }, label: 'Control room' },
  ],
  frame: { x: 16, y: 96, w: 328, h: 276 },
  nodes: {
    telemetry: { x: 44, y: 128, w: 272, h: 80 },
    occ: { x: 44, y: 268, w: 272, h: 80 },
    aws: { x: 28, y: 84, w: 170, h: 28 },
    adr: { x: 16, y: 484, w: 328, h: 56 },
    pipelines: { x: 16, y: 550, w: 328, h: 56 },
  },
  edges: [
    { d: 'M180 50 V128', label: 'MQTT', lx: 214, ly: 74 },
    { d: 'M180 208 V268', label: 'alerts', lx: 216, ly: 242 },
    { d: 'M180 348 V418', label: 'live', lx: 206, ly: 396 },
  ],
  flow: 'M180 50 V418',
};

const SUBTITLE: Record<ProjectId, string> = {
  telemetry: 'Sensor data in, alerts out',
  occ: 'Incidents, map and cameras',
  aws: 'Platform on AWS',
  adr: 'how the platform is designed',
  pipelines: 'how both systems are built',
};

function Diagram({
  layout,
  className,
  projects,
  selected,
  onSelect,
  onKey,
}: {
  layout: Layout;
  className: string;
  projects: Project[];
  selected: ProjectId;
  onSelect: (id: ProjectId) => void;
  onKey: (e: KeyboardEvent<SVGGElement>, id: ProjectId) => void;
}) {
  const byId = Object.fromEntries(projects.map((p) => [p.id, p])) as Record<ProjectId, Project>;
  const { frame } = layout;

  const node = (id: ProjectId) => {
    const b = layout.nodes[id];
    const p = byId[id];
    const isSelected = id === selected;
    const kind = id === 'aws' ? 'tag' : id === 'adr' || id === 'pipelines' ? 'lane' : 'system';
    return (
      <g
        key={id}
        role="tab"
        id={`tab-${id}-${className}`}
        tabIndex={isSelected ? 0 : -1}
        aria-selected={isSelected}
        aria-controls="project-panel"
        aria-label={p.name}
        className={`node node-${kind}${isSelected ? ' is-selected' : ''}`}
        data-project={id}
        onClick={() => onSelect(id)}
        onKeyDown={(e) => onKey(e, id)}
      >
        <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={kind === 'tag' ? 14 : 10} />
        {kind === 'system' && (
          <>
            <text x={b.x + 16} y={b.y + 36} className="node-title">
              {p.name}
            </text>
            <text x={b.x + 16} y={b.y + 60} className="node-sub">
              {SUBTITLE[id]}
            </text>
          </>
        )}
        {kind === 'tag' && (
          <text x={b.x + b.w / 2} y={b.y + 19} textAnchor="middle" className="node-tag">
            {SUBTITLE[id]}
          </text>
        )}
        {kind === 'lane' &&
          (b.w > 400 ? (
            <text x={b.x + 16} y={b.y + b.h / 2 + 5} className="node-lane">
              <tspan className="node-lane-name">{p.name}</tspan>: {SUBTITLE[id]}
            </text>
          ) : (
            <text x={b.x + 16} y={b.y + 23} className="node-lane">
              <tspan className="node-lane-name">{p.name}</tspan>
              <tspan x={b.x + 16} dy="18">
                {SUBTITLE[id].replace(/^./, (c) => c.toUpperCase())}
              </tspan>
            </text>
          ))}
      </g>
    );
  };

  return (
    <svg
      className={`diagram ${className}`}
      viewBox={layout.viewBox}
      role="tablist"
      aria-label="Public repositories"
    >
      <defs>
        <marker
          id={`arrow-${className}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 1 L9 5 L0 9 z" className="arrowhead" />
        </marker>
      </defs>
      <rect className="frame" x={frame.x} y={frame.y} width={frame.w} height={frame.h} rx="16" />
      {layout.external.map(({ box, label }) => (
        <g key={label} className="external" aria-hidden="true">
          <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="10" />
          <text x={box.x + box.w / 2} y={box.y + box.h / 2 + 5} textAnchor="middle">
            {label}
          </text>
        </g>
      ))}
      {layout.edges.map((e) => (
        <g key={e.d} className="edge" aria-hidden="true">
          <path d={e.d} markerEnd={`url(#arrow-${className})`} />
          <text x={e.lx} y={e.ly} textAnchor="middle">
            {e.label}
          </text>
        </g>
      ))}
      <g className="packets" aria-hidden="true">
        {[0, -1.4, -2.8].map((begin) => (
          <circle key={begin} r="3.5" cx="-20" cy="-20">
            <animateMotion dur="4.2s" begin={`${begin}s`} repeatCount="indefinite" path={layout.flow} />
          </circle>
        ))}
      </g>
      {(['telemetry', 'occ', 'aws', 'adr', 'pipelines'] as const).map(node)}
    </svg>
  );
}

export function Platform({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState<ProjectId>('occ');
  const root = useRef<HTMLDivElement>(null);
  const order = projects.map((p) => p.id);
  const project = projects.find((p) => p.id === selected) ?? projects[0]!;

  const select = (id: ProjectId, focus = false) => {
    setSelected(id);
    if (focus) {
      // Only one of the two diagrams is displayed; focus the tab in the visible one.
      const tabs = root.current?.querySelectorAll<SVGGElement>(`[data-project="${id}"]`) ?? [];
      Array.from(tabs)
        .find((t) => t.getClientRects().length > 0)
        ?.focus();
    }
  };

  const onKey = (e: KeyboardEvent<SVGGElement>, id: ProjectId) => {
    const i = order.indexOf(id);
    const go = (j: number) => {
      e.preventDefault();
      select(order[(j + order.length) % order.length]!, true);
    };
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(order.length - 1);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(id);
    }
  };

  const shared = { projects, selected, onSelect: (id: ProjectId) => select(id), onKey };

  return (
    <div className="platform" ref={root}>
      <Diagram layout={WIDE} className="diagram-wide" {...shared} />
      <Diagram layout={NARROW} className="diagram-narrow" {...shared} />
      <p className="platform-hint">Select a part of the platform to see its repository.</p>

      <div className="panel" id="project-panel" role="tabpanel" aria-live="polite">
        <div className="panel-text">
          <h3>{project.name}</h3>
          <p>{project.what}</p>
          <p className="panel-proof">
            <strong>What you can check: </strong>
            {project.proof}
          </p>
          <ul className="stack" aria-label="Technology">
            {project.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <a className="button" href={project.repo}>
            Open the repository
          </a>
        </div>
        {project.image && (
          <figure className="panel-figure">
            <img
              src={`/${project.image.src}`}
              alt={project.image.alt}
              width={1600}
              height={900}
              loading="lazy"
              decoding="async"
            />
            <figcaption>{project.image.caption}</figcaption>
          </figure>
        )}
      </div>
    </div>
  );
}
