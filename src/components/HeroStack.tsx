import type { StackLayer, StackLayerId } from '../content/types';
import { Icon, type IconName } from './Icon';

const LAYER_ICON: Record<StackLayerId, IconName> = {
  frontend: 'monitor',
  backend: 'server',
  data: 'database',
  cloud: 'cloud',
};

interface HeroStackProps {
  layers: StackLayer[];
  /** Tools named in the CV summary: solid chips with a gold dot. The rest are outlined. */
  coreStack: string[];
}

/** The technology stack as four layers on a data bus. Plain lists, so assistive technology and crawlers read every tool. */
export function HeroStack({ layers, coreStack }: HeroStackProps) {
  const core = new Set(coreStack);
  return (
    <div className="hero-stack" role="group" aria-label="Technology stack">
      {layers.map((layer) => (
        <div key={layer.id} className="hero-layer">
          <div className="hero-layer-head">
            <Icon name={LAYER_ICON[layer.id]} className="icon hero-layer-icon" />
            <span>{layer.label}</span>
          </div>
          <ul aria-label={layer.label}>
            {layer.items.map((item) => (
              <li key={item} className={core.has(item) ? 'is-core' : undefined}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
