import type { Resume } from './types';

const GH = 'https://github.com/truongtankhanh';

export const resume: Resume = {
  name: 'Trương Tấn Khánh',
  nameAscii: 'Truong Tan Khanh',
  headline: 'Full-stack engineer',
  intro: [
    'I take systems from requirements to production: architecture, ticket-level planning, documentation that stands up to client review, and hands-on implementation of the hardest parts.',
    'Today I lead the engineering of operations platforms for clients in Singapore: NestJS backends, React and Angular frontends, IoT and live-video integrations, and the infrastructure they run on. I have been shipping production software since 2018.',
  ],
  location: 'Lâm Đồng, Vietnam',
  timezone: 'UTC+7',
  availability: 'Open to remote roles in technical leadership and full-stack engineering',
  email: 'ttkhanh100896@gmail.com',
  links: {
    github: GH,
    linkedin: 'https://www.linkedin.com/in/truongtankhanh/',
  },

  projects: [
    {
      id: 'occ',
      name: 'Ops Command Center',
      repo: `${GH}/ops-command-center`,
      what: 'A real-time console for a campus control room: live incidents on a site map, the cameras covering each incident, and a response workflow where every action is recorded.',
      proof:
        'Incident lifecycle enforced by the domain, events published only after commit, end-to-end tests on a real PostgreSQL, and the whole stack up with one command.',
      stack: ['NestJS', 'React 19', 'MapLibre', 'three.js', 'Socket.IO', 'Keycloak', 'PostgreSQL'],
      image: {
        src: 'images/console-overview.webp',
        alt: 'Operator console with an incident list, a campus map with incident markers, and camera tiles',
        caption: 'The operator console on the demo campus.',
      },
    },
    {
      id: 'telemetry',
      name: 'IoT Telemetry Pipeline',
      repo: `${GH}/iot-telemetry-pipeline`,
      what: 'Sensor readings from the campus arrive over MQTT, are stored in PostgreSQL, and turn into alerts that open and resolve incidents in the command center.',
      proof:
        'About 10,000 messages a second on one replica with no loss and no duplicates; alerts delivered through an outbox; ready for Kubernetes.',
      stack: ['NestJS', 'MQTT 5', 'PostgreSQL', 'Prometheus', 'Kubernetes'],
      image: {
        src: 'images/occ-incident-from-telemetry.webp',
        alt: 'A server-room temperature incident in the command center, raised by the telemetry pipeline',
        caption: 'Three readings over 27 °C opened this incident; it resolved itself when the room cooled.',
      },
    },
    {
      id: 'aws',
      name: 'Platform on AWS',
      repo: `${GH}/platform-aws`,
      what: 'Both systems described as AWS CDK code: containers on ECS Fargate, RDS PostgreSQL, AWS IoT Core for devices, CloudFront and WAF in front.',
      proof:
        'cdk-nag security rules pass on every synth, least privilege is asserted in tests, and deploys use GitHub OIDC with no stored keys.',
      stack: ['AWS CDK', 'TypeScript', 'ECS Fargate', 'RDS', 'IoT Core', 'CloudFront'],
    },
    {
      id: 'adr',
      name: 'Architecture Decisions',
      repo: `${GH}/architecture-decisions`,
      what: 'The written design of the platform: C4 views, the decisions that cross system boundaries, and how a decision gets reviewed.',
      proof:
        'Twelve decision records with the options that were rejected and why, including one superseded when its assumption turned out wrong.',
      stack: ['ADRs', 'C4 model', 'Mermaid'],
    },
    {
      id: 'pipelines',
      name: 'Claude Code Pipelines',
      repo: `${GH}/claude-code-pipelines`,
      what: 'The AI-assisted workflow both systems were built with: each job is analysed, planned, applied and verified in separate stages a person can review and correct.',
      proof:
        'Plans are written before code, file scope is fixed, nothing is committed automatically, and real runs are published next to the commits they produced.',
      stack: ['Claude Code plugin', 'Markdown artifacts'],
    },
  ],

  experience: [
    {
      company: 'Surbana Jurong',
      title: 'Project Lead, full-stack',
      start: '2024-04',
      summary:
        'I lead a team of three or more developers across about 50 repositories and services, turning requirements from the project manager into detailed designs and implementation plans.',
      work: [
        {
          name: 'Unified Command System',
          context:
            'Command-center portal for island-wide operations in Singapore: an operator console and a three-projector video wall with live cameras, maps and incidents.',
          points: [
            'Designed the monorepo architecture (pnpm workspaces and Turborepo): two apps and nine shared packages.',
            'Broke the full scope into 44 implementation-ready tickets across every feature epic, checked against the Figma designs.',
            'Designed the camera integration through the site’s video management system, relayed to browsers by MediaMTX behind an adapter, so mock and production sources switch by configuration.',
            'Set the key technical decisions: OneMap-based 2D maps with MapLibre and deck.gl, Entra ID single sign-on with an in-app permission model, and a single on-prem Docker Compose deployment.',
            'Build the operator-view app hands-on.',
          ],
        },
        {
          name: 'IoT building-management platform',
          context: 'Backend that processes and serves IoT data for an automated building-management system.',
          points: [
            'Primary developer of the core data processing and provisioning features (Node.js, TypeORM, PostgreSQL).',
            'Shipped services as Docker images to AWS ECR, running on Kubernetes; reviewed the team’s code and tests.',
          ],
          link: { label: 'Related open-source work', href: `${GH}/iot-telemetry-pipeline` },
        },
        {
          name: 'AI-assisted engineering workflow',
          points: [
            'Designed and maintain the team’s Claude Code pipelines used daily on NestJS, Angular and React code: diff-scoped self-review before PM review, API documentation with drift detection, test and lint scaffolding, and the ticket pipeline that delivered the command-center monorepo.',
          ],
          link: { label: 'Public edition', href: `${GH}/claude-code-pipelines` },
        },
      ],
    },
    {
      company: 'NewIT Vietnam',
      title: 'Backend Developer',
      start: '2020-07',
      end: '2024-02',
      summary:
        'Built and ran cross-border e-commerce integrations that keep products listed on Tmall, eBay US, Mercari, 95Point and Yahoo Shopping.',
      work: [
        {
          points: [
            'Brandtmall, three years: built the AWS ECS services that keep Tmall listings in sync (S3, DynamoDB, AWS Translate); in phase two, led the move from JavaScript to TypeScript microservices on MySQL and owned image processing.',
            'Sole core developer of an eBay US listing service and core developer of a 95Point integration, owning staging and production releases.',
            'Primary developer of the Mercari integration and developer and code reviewer on the Yahoo Shopping integration (TypeScript, AWS CDK, RDS, TypeORM).',
            'Proposed, built and ran an internal serverless tool (API Gateway, React, CloudFront) that replaced direct edits of files on S3 with controlled, auditable updates.',
          ],
        },
      ],
    },
    {
      company: 'AMIT Group',
      title: 'Web Developer',
      start: '2020-03',
      end: '2020-06',
      work: [
        {
          points: [
            'Web APIs with ASP.NET Core and Entity Framework Core, and Angular UI, for an AI-driven web platform.',
          ],
        },
      ],
    },
    {
      company: 'HHD Group',
      title: 'Mobile Developer',
      start: '2018-12',
      end: '2020-02',
      work: [{ points: ['React Native apps connected to the company’s ERP system.'] }],
    },
  ],

  skills: [
    {
      name: 'Backend',
      items: ['Node.js', 'NestJS', 'TypeScript', 'TypeORM', 'REST and OpenAPI', 'Socket.IO', 'MQTT'],
    },
    {
      name: 'Frontend',
      items: ['React', 'Angular', 'TanStack Query', 'Zustand', 'RxJS', 'MapLibre', 'deck.gl'],
    },
    { name: 'Data', items: ['PostgreSQL', 'MySQL', 'DynamoDB'] },
    {
      name: 'Cloud and delivery',
      items: [
        'AWS (ECS, CDK, RDS, S3, CloudFront, IoT Core)',
        'Docker',
        'Kubernetes',
        'GitHub Actions',
        'Prometheus',
      ],
    },
    {
      name: 'Ways of working',
      items: [
        'Architecture decision records',
        'Ticket-level planning',
        'pnpm and Turborepo monorepos',
        'Playwright and unit testing',
        'AI-assisted delivery with Claude Code',
      ],
    },
  ],

  principles: [
    {
      title: 'Design is written down',
      body: 'Decisions and tickets are documented and reviewed before code is written.',
    },
    {
      title: 'Simple scales',
      body: 'Framework-native solutions first; every new tool has to earn its place.',
    },
    {
      title: 'Standards are a team asset',
      body: 'Shared conventions and automated review let a small team move quickly across many repositories.',
    },
    {
      title: 'Leads still ship',
      body: 'I stay in the code, because good decisions come from knowing where the real complexity is.',
    },
  ],

  education: {
    school: 'Ton Duc Thang University',
    detail: 'Computer Science, not completed',
    start: 2014,
    end: 2018,
  },
  languages: [
    { name: 'Vietnamese', level: 'Native' },
    { name: 'English', level: 'Reads and writes technical documentation; improving spoken English' },
  ],
};
