import type { CaseStudy } from './types';

/**
 * A complete case study for tests of the template, the head and the route list. It is not shown on the site: the
 * real pages are written from the repositories in V1-11 and V1-12.
 */
export function sampleCaseStudy(slug = 'sample-project'): CaseStudy {
  return {
    slug,
    lead: 'Lead sentence of the case study.',
    role: 'Role sample',
    status: 'Status sample',
    overview: ['First overview paragraph.', 'Second overview paragraph.'],
    does: {
      lead: {
        title: 'Lead capability',
        text: 'Reaches every console **within a second**, in order.',
        figure: { value: '1 s', label: 'for a report to reach every console' },
        image: { src: 'images/lead.webp', alt: 'Lead alt', caption: 'Lead caption.' },
      },
      more: [
        { icon: 'video', title: 'Card one', text: 'Has a **key phrase one** inside.' },
        { icon: 'circleCheck', title: 'Card two', text: 'Has a **key phrase two** inside.' },
        { icon: 'map', title: 'Card three', text: 'Has a **key phrase three** inside.' },
      ],
    },
    decisions: [
      { id: 'ADR-0001', title: 'First decision', why: 'Why the first.' },
      { id: 'ADR-0002', title: 'Second decision', why: 'Why the second.' },
    ],
    check: ['Check paragraph one.', 'Check paragraph two.'],
    run: { intro: 'One command.', commands: 'pnpm start\n# App  http://localhost:1' },
  };
}
