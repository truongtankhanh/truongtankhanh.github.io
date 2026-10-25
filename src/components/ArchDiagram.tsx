import { Fragment } from 'react';
import type { Architecture, Project, ProjectId } from '../content/types';

interface ArchDiagramProps {
  architecture: Architecture;
  projects: Project[];
}

/**
 * How the repositories fit together, as plain HTML: an ordered list of boxes joined by labelled arrows, with the
 * platform that hosts them in a band underneath. The arrows are decoration (`aria-hidden`); their labels are text.
 */
export function ArchDiagram({ architecture, projects }: ArchDiagramProps) {
  const project = (id: ProjectId) => {
    const found = projects.find((p) => p.id === id);
    if (!found)
      throw new Error(`The architecture names the project "${id}", which is not in the projects list`);
    return found;
  };
  const { title, summary, nodes, flows, platform } = architecture;

  return (
    <div className="arch plate">
      <div className="arch-head">
        <h3>{title}</h3>
        <p>{summary}</p>
      </div>
      <ol className="arch-row">
        {nodes.map((node, i) => (
          <Fragment key={'project' in node ? node.project : node.name}>
            {'project' in node ? (
              <li className="arch-node is-repo">
                <span className="arch-tag">Repository</span>
                <b>{project(node.project).name}</b>
                <small>{node.note}</small>
              </li>
            ) : (
              <li className="arch-node">
                <b>{node.name}</b>
                <small>{node.note}</small>
              </li>
            )}
            {flows[i] && (
              <li className="arch-edge">
                <span>{flows[i]}</span>
                <i aria-hidden="true" />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
      <div className="arch-base">
        <span className="arch-tag">Runs on</span>
        <p>
          <b>{project(platform.project).name}</b> · {platform.services.join(' · ')}, {platform.note}
        </p>
      </div>
    </div>
  );
}
