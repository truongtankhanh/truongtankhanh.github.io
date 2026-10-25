import { Fragment } from 'react';
import type { Engagement, Role } from '../content/types';
import { emphasis } from '../lib/emphasis';
import { formatMonth } from '../lib/dates';

/** A bullet with its key phrase in strong ink and the rest in the quieter colour; the words are the content's own. */
function Bullets({ points }: { points: string[] }) {
  return (
    <ul>
      {points.map((point) => (
        <li key={point}>
          {emphasis(point).map((part, i) =>
            part.strong ? <strong key={i}>{part.text}</strong> : <Fragment key={i}>{part.text}</Fragment>,
          )}
        </li>
      ))}
    </ul>
  );
}

/** A named engagement is a bordered box; one without a name is a flat list of bullets. */
function EngagementBlock({ engagement }: { engagement: Engagement }) {
  return (
    <div className={engagement.name ? 'engagement' : 'engagement is-flat'}>
      {engagement.name && <h4>{engagement.name}</h4>}
      {engagement.context && <p className="engagement-context">{engagement.context}</p>}
      <Bullets points={engagement.points} />
      {engagement.link && (
        <a className="engagement-link" href={engagement.link.href}>
          {engagement.link.label}
        </a>
      )}
    </div>
  );
}

/** The roles as a timeline, newest first: dates on the left, a rail with a node per role, then the role itself. */
export function Experience({ roles }: { roles: Role[] }) {
  return (
    <section id="experience" className="section" aria-labelledby="experience-title">
      <div className="sec-head">
        <h2 id="experience-title">Experience</h2>
      </div>
      <ol className="timeline">
        {roles.map((role) => (
          <li key={role.company} className={role.end ? 'role' : 'role is-current'}>
            <div className="role-when">
              <p className="role-dates">
                <time dateTime={role.start}>{formatMonth(role.start)}</time>
                {' – '}
                {role.end ? <time dateTime={role.end}>{formatMonth(role.end)}</time> : 'present'}
              </p>
              {!role.end && <p className="role-badge">Current</p>}
            </div>
            <div className="role-rail" aria-hidden="true">
              <i />
            </div>
            <div className="role-body">
              <h3>
                {role.company}
                <span className="role-title">{role.title}</span>
              </h3>
              {role.summary && <p className="role-summary">{role.summary}</p>}
              {role.work.map((w, i) => (
                <EngagementBlock key={w.name ?? i} engagement={w} />
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
