import type { SkillGroup, SkillKind } from '../content/types';
import { Icon, type IconName } from './Icon';

/** The icon of each group; the CV page draws the same ones. */
export const GROUP_ICON: Record<SkillKind, IconName> = {
  backend: 'server',
  frontend: 'monitor',
  data: 'database',
  cloud: 'cloud',
  practice: 'layers',
};

interface SkillsProps {
  groups: SkillGroup[];
  /** The tools the CV summary names, in its order. */
  coreStack: string[];
  coreStackNote: string;
}

/** Two tiers: the core stack in large type, then a card for each group with the places it was used. */
export function Skills({ groups, coreStack, coreStackNote }: SkillsProps) {
  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <div className="sec-head">
        <h2 id="skills-title">Skills</h2>
      </div>

      <div className="core plate-dark">
        <div>
          <p className="core-label">Core stack</p>
          <p className="core-note">{coreStackNote}.</p>
        </div>
        <ul className="core-list" aria-label="Core stack">
          {coreStack.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
      </div>

      <ul className="skill-grid">
        {groups.map((group) => (
          <li key={group.name}>
            <article className="skill-card plate">
              <div className="skill-head">
                <Icon name={GROUP_ICON[group.kind]} className="icon skill-icon" />
                <h3>{group.name}</h3>
              </div>
              <ul className="skill-chips" aria-label={group.name}>
                {group.items.map((item) => (
                  <li key={item} className="chip">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="skill-used">
                <span className="skill-used-label">Shown in</span> {group.usedIn.join(', ')}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
