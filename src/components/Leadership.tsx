import type { Resume } from '../content/types';

type LeadershipProps = Pick<Resume, 'leadership' | 'principles' | 'education' | 'languages'>;

/** Scope first, then each principle with the work that backs it, then the facts a hiring manager looks for. */
export function Leadership({ leadership, principles, education, languages }: LeadershipProps) {
  return (
    <section id="approach" className="section" aria-labelledby="approach-title">
      <div className="sec-head">
        <h2 id="approach-title">How I work</h2>
      </div>

      <div className="lead-scope plate">
        <ul className="lead-figures" aria-label="Scope of leadership">
          {leadership.figures.map((f) => (
            <li key={f.value}>
              <span className="lead-value">{f.value}</span>
              <span className="lead-label">{f.label}</span>
            </li>
          ))}
        </ul>
        <div className="lead-owns">
          <p className="lead-owns-label">What I own</p>
          <ul className="tick-list">
            {leadership.owns.map((own) => (
              <li key={own}>{own}</li>
            ))}
          </ul>
        </div>
      </div>

      <ul className="principle-grid">
        {principles.map((p) => (
          <li key={p.title}>
            <article className="principle plate">
              <h3>{p.title}</h3>
              <p className="principle-body">{p.body}</p>
              <p className="in-practice">In practice</p>
              <ul className="evidence">
                {p.evidence.map((e) => (
                  <li key={e.text}>
                    <q>{e.text}</q>
                    <cite>{e.source}</cite>
                  </li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ul>

      <dl className="fact-row">
        <div>
          <dt>Education</dt>
          <dd className="fact-main">{education.school}</dd>
          <dd className="fact-sub">
            {education.detail} ({education.start}–{education.end})
          </dd>
        </div>
        {languages.map((l) => (
          <div key={l.name}>
            <dt>{l.name}</dt>
            <dd className="fact-main">{l.level}</dd>
            {l.detail && <dd className="fact-sub">{l.detail}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
