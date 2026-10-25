import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { resume } from '../content/resume';
import { Hero } from './Hero';
import { Metrics } from './Metrics';

const items = (markup: string) => [...markup.matchAll(/<li>(.*?)<\/li>/g)].map((m) => m[1]!);

describe('Metrics', () => {
  it('labels the strip and shows a value, a label and a source for every metric', () => {
    const markup = renderToString(<Metrics metrics={resume.metrics} />);
    expect(markup).toContain('<ul class="metrics" aria-label="Career at a glance">');
    const rows = items(markup);
    expect(rows).toHaveLength(resume.metrics.length);
    resume.metrics.forEach((m, i) => {
      expect(rows[i]).toContain(`>${m.value}</span>`);
      expect(rows[i]).toContain(`>${m.label}</span>`);
      expect(rows[i]).toContain(`>${m.source}</small>`);
    });
  });

  it('renders from its data only: removing a metric removes it, and no data renders nothing', () => {
    const fewer = resume.metrics.slice(1);
    const markup = renderToString(<Metrics metrics={fewer} />);
    expect(items(markup)).toHaveLength(fewer.length);
    expect(markup).not.toContain(resume.metrics[0]!.label);
    expect(renderToString(<Metrics metrics={[]} />)).toBe('');
  });

  it('is the bottom row of the hero, after the stack', () => {
    const markup = renderToString(<Hero resume={resume} />);
    expect(markup.match(/Career at a glance/g)).toHaveLength(1);
    expect(markup.indexOf('class="hero-stack"')).toBeLessThan(markup.indexOf('class="metrics"'));
    expect(markup.indexOf('class="metrics"')).toBeLessThan(markup.indexOf('</section>'));
  });
});
