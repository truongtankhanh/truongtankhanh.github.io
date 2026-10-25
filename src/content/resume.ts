import type { Resume } from './types';

const GH = 'https://github.com/truongtankhanh';

export const resume: Resume = {
  name: 'Trương Tấn Khánh',
  nameAscii: 'Truong Tan Khanh',
  headline: 'Full-stack Engineer',
  intro: [
    'I design, build and ship systems end to end: system design, NestJS and Node.js backends, React and Angular frontends, and the DevOps that runs them. I take work from requirements to production, with documentation that stands up to client review.',
    'Today I work on operations platforms for clients in Singapore, from IoT and live-video integrations to the infrastructure they run on. I have been shipping production software since 2018.',
  ],
  coreStack: ['Node.js', 'TypeScript', 'NestJS', 'React', 'Angular', 'PostgreSQL'],
  coreStackNote: 'Node.js and TypeScript systems with NestJS, Angular, React and PostgreSQL',
  heroStack: [
    {
      id: 'frontend',
      label: 'Frontend',
      group: 'Frontend',
      items: ['React', 'Angular', 'MapLibre', 'deck.gl'],
    },
    {
      id: 'backend',
      label: 'Backend',
      group: 'Backend',
      items: ['Node.js', 'TypeScript', 'NestJS', 'Socket.IO'],
    },
    { id: 'data', label: 'Data', group: 'Data', items: ['PostgreSQL', 'MySQL', 'DynamoDB'] },
    {
      id: 'cloud',
      label: 'Cloud',
      group: 'Cloud and DevOps',
      items: ['AWS', 'Docker', 'Kubernetes', 'GitHub Actions'],
    },
  ],
  currentlyNote: 'Leading engineering for clients in Singapore',
  location: 'Lâm Đồng, Vietnam',
  timezone: 'UTC+7',
  availability: 'Open to remote full-stack engineering work, full-time, part-time or contract',
  email: 'ttkhanh100896@gmail.com',
  siteUrl: 'https://truongtankhanh.github.io/',
  cvPdf: 'Truong_Tan_Khanh_CV.pdf',
  cv: { pdf: '/Truong_Tan_Khanh_CV.pdf', fileName: 'Truong_Tan_Khanh_CV.pdf', published: false },
  links: {
    github: GH,
    linkedin: 'https://www.linkedin.com/in/truongtankhanh/',
  },

  metrics: [
    { value: '7+', label: 'years shipping production software', source: 'Since December 2018' },
    {
      value: '5+',
      label: 'marketplaces integrated',
      source: 'Tmall, eBay US, Mercari, 95Point, Yahoo Shopping and more',
    },
    { value: '3+', label: 'engineers led', source: 'Surbana Jurong, since April 2024' },
    { value: '~50', label: 'repositories and services', source: 'NestJS, Angular, React, PostgreSQL' },
    { value: '~10k/s', label: 'messages on one replica', source: 'Open-source telemetry pipeline' },
  ],

  projects: [
    {
      id: 'occ',
      name: 'Ops Command Center',
      repo: `${GH}/ops-command-center`,
      what: 'A real-time console for a campus control room: live incidents on a site map, the cameras covering each incident, and a response workflow where every action is recorded.',
      proof:
        'Incident lifecycle enforced by the domain, events published only after commit, end-to-end tests on a real PostgreSQL, and the whole stack up with one command.',
      checks: [
        'Incident lifecycle enforced by the domain',
        'Events published only after commit',
        'End-to-end tests on a real PostgreSQL',
        'The whole stack up with one command',
      ],
      stack: ['NestJS', 'React 19', 'MapLibre', 'three.js', 'Socket.IO', 'Keycloak', 'PostgreSQL'],
      image: {
        src: 'images/console-overview.webp',
        alt: 'Operator console with an incident list, a campus map with incident markers, and camera tiles',
        caption: 'The operator console on the demo campus.',
      },
      // Every sentence is quoted or paraphrased from README.md or docs/adr/ of the repository at commit 816b86a;
      // the source line of each is recorded in the pull request that added it.
      caseStudy: {
        slug: 'ops-command-center',
        lead: 'A real-time operations console for a campus security and facilities team: one screen that answers what is happening, where, and who is handling it.',
        role: 'Author and maintainer',
        status: 'Runs on a fictional campus with one command',
        overview: [
          'The demo runs on Langbiang Tech Campus, a fictional site with synthetic incidents and simulated cameras. One command brings up the whole stack.',
          'Live incidents are drawn on a site map with camera tiles next to every incident, and the response workflow is auditable: every timeline entry shows who made it.',
        ],
        does: {
          lead: {
            title: 'Live incident feed',
            text: 'New reports appear on every open console **within a second**, ordered by what needs attention first: unresolved, then severity, then age.',
            figure: { value: '1 s', label: 'goal for a new report to appear on every open console' },
          },
          more: [
            {
              icon: 'video',
              title: 'Cameras in context',
              text: 'The cameras covering an incident’s zone come first, rendered through a **source-agnostic stream descriptor**: mock feeds now, RTSP via MediaMTX next.',
            },
            {
              icon: 'circleCheck',
              title: 'Respond and record',
              text: 'Acknowledge or resolve with an optional note. Every change is written to the incident’s timeline, and **invalid transitions are rejected by the server**.',
            },
            {
              icon: 'map',
              title: 'Map, 3D twin and video wall',
              text: 'A **site plan that works fully offline**, a three.js twin of the campus where the browser can create a WebGL 2 context, and a read-only control-room screen: a window opened as /?wall=N.',
            },
          ],
        },
        decisions: [
          {
            id: 'ADR-0003',
            title: 'Domain events in-process, broadcast with Socket.IO',
            why: 'A Socket.IO gateway that only listens broadcasts the domain events to connected consoles; ADR-0007 later amended how they are delivered.',
          },
          {
            id: 'ADR-0007',
            title: 'Transactional outbox for incident events',
            why: 'The event is written in the same transaction as the change, so a committed change is always announced; delivery is at-least-once.',
          },
          {
            id: 'ADR-0008',
            title: 'Several API replicas, events fanned out through Postgres',
            why: 'Postgres NOTIFY hands every event to every API replica, so a change made on one reaches consoles connected to another, with no broker to run.',
          },
          {
            id: 'ADR-0009',
            title: 'Idempotent incident creation with an Idempotency-Key',
            why: 'A retried report replays the first response instead of creating a duplicate.',
          },
          {
            id: 'ADR-0010',
            title: 'OIDC authentication for REST and WebSocket',
            why: 'Keycloak in Compose sits behind nginx on the console’s origin, and the API is an OAuth 2.0 resource server that verifies access tokens with jose.',
          },
          {
            id: 'ADR-0011',
            title: 'Role-based authorization and the timeline actor',
            why: 'Permissions are granted per role and checked by the API, and every timeline entry records its actor.',
          },
        ],
        check: [
          'Start the stack with two API replicas (pnpm docker:stack:replicas), open the console in two browser windows and acknowledge an incident in one: it updates in the other within a second.',
          'With round-robin, the two windows are usually on different replicas; pnpm docker:compose logs api shows which replica each console connected to.',
          'The one-second goal is measured: incident_event_delivery_seconds times each event from its outbox row to its broadcast on every replica, and an opt-in Grafana dashboard plots it against the goal.',
          'The lifecycle rules live in the entity, where IncidentEntity.acknowledge() and resolve() enforce the transitions, and pnpm test:e2e runs the API against a real PostgreSQL.',
        ],
        run: {
          intro:
            'One command brings up the whole stack. The demo accounts are listed in the repository README.',
          commands:
            'pnpm docker:stack        # docker compose up --build\n# Console      http://localhost:18080\n# API + docs   http://localhost:18080/api/docs   (read-only; off by default in production — ADR-0005)',
        },
      },
    },
    {
      id: 'telemetry',
      name: 'IoT Telemetry Pipeline',
      repo: `${GH}/iot-telemetry-pipeline`,
      what: 'Sensor readings from the campus arrive over MQTT, are stored in PostgreSQL, and turn into alerts that open and resolve incidents in the command center.',
      proof:
        'About 10,000 messages a second on one replica with no loss and no duplicates; alerts delivered through an outbox; ready for Kubernetes.',
      checks: [
        'About 10,000 messages a second on one replica with no loss and no duplicates',
        'Alerts delivered through an outbox',
        'Ready for Kubernetes',
      ],
      stat: { value: '~10k/s', label: 'messages on one replica' },
      statSource: 'About 10,000 messages a second',
      stack: ['NestJS', 'MQTT 5', 'PostgreSQL', 'Prometheus', 'Kubernetes'],
      image: {
        src: 'images/occ-incident-from-telemetry.webp',
        alt: 'A server-room temperature incident in the command center, raised by the telemetry pipeline',
        caption: 'Three readings over 27 °C opened this incident; it resolved itself when the room cooled.',
      },
      // Every sentence is quoted or paraphrased from README.md, docs/benchmarks.md or docs/adr/ of the repository at
      // commit f830fa5; the source line of each is recorded in the pull request that added it.
      caseStudy: {
        slug: 'iot-telemetry-pipeline',
        lead: 'Sensor telemetry from a campus, ingested over MQTT, stored in PostgreSQL, turned into alerts with hysteresis, and delivered as incidents to ops-command-center.',
        role: 'Author and maintainer',
        status: 'A V1 demonstration: synthetic devices, one command to run, not for production use',
        overview: [
          'This is a V1 demonstration system and is not intended for production use: devices and readings are synthetic, the broker allows anonymous clients, and the HTTP API has no authentication. Known data-loss and metric-accuracy limits are tracked as open V1 tasks in the repository.',
          'The pipeline owns telemetry and ops-command-center owns incidents. Only a sustained, filtered breach crosses between them, as an incident in the right zone, authenticated with client credentials. Each side also runs without the other.',
        ],
        does: {
          lead: {
            title: 'Ingest that scales out',
            text: 'Replicas share one **MQTT 5 shared subscription**, so ingest scales out by adding replicas. One replica takes about **10,000 messages a second** from the broker to committed rows, with nothing lost and no duplicates.',
            figure: {
              value: '~10k/s',
              label: 'messages on one replica, with nothing lost and no duplicates',
            },
          },
          more: [
            {
              icon: 'database',
              title: 'Idempotent storage, measured loss',
              text: 'Redelivered messages hit the primary key and rollups are computed from the rows actually inserted, so **duplicates never inflate counts**. Per-device sequence numbers expose every lost message as a metric.',
            },
            {
              icon: 'circleCheck',
              title: 'Alerts that do not flap',
              text: 'A rule opens an alert only after **consecutive breaches** and clears it at a **separate clear threshold**: three readings over 27 °C open it, and it resolves when the temperature falls back below 25.5 °C.',
            },
            {
              icon: 'server',
              title: 'Reliable delivery to incidents',
              text: 'Opening or clearing an alert writes an outbox row in the same transaction. A delivery worker creates the incident in ops-command-center with **lease-based claiming and backoff**, and resolves it when the alert clears.',
            },
          ],
        },
        decisions: [
          {
            id: 'ADR-0001',
            title: 'Scale ingest horizontally with MQTT 5 shared subscriptions',
            why: 'The broker load-balances messages across the replicas in the group, so scaling is adding replicas; nothing may rely on per-device in-memory state being complete.',
          },
          {
            id: 'ADR-0002',
            title: 'Acknowledge on receipt; bound and measure the loss window',
            why: 'Acknowledging only after a commit would put one message in each batch, so it acknowledges on receipt, flushes every 250 ms or 1,000 readings, and counts every lost message as a sequence gap.',
          },
          {
            id: 'ADR-0003',
            title: 'Plain PostgreSQL: daily partitions and write-time rollups',
            why: 'Retention is a DROP TABLE on an old partition, and the per-minute rollup is updated in the same transaction from the rows the insert returned, so it runs on any PostgreSQL 14 or later.',
          },
          {
            id: 'ADR-0004',
            title: 'Threshold rules with consecutive breaches and hysteresis',
            why: 'A raise threshold, a separate clear threshold and a consecutive-breach count give one alert per real episode; a partial unique index allows one open alert per device and rule.',
          },
          {
            id: 'ADR-0005',
            title: 'Deliver alerts through a transactional outbox',
            why: 'The delivery row is inserted in the same transaction as the alert, so ingest never waits on the command center and an outage only delays incidents; delivery is at least once.',
          },
          {
            id: 'ADR-0006',
            title: 'Authenticate to the command center with client credentials',
            why: 'The pipeline is a confidential OAuth 2.0 client whose service account holds the technician role, and incident creation sends an Idempotency-Key so a retry returns the incident created the first time.',
          },
        ],
        check: [
          'Throughput is measured end to end, from messages published to the broker until every reading is committed in PostgreSQL, by apps/simulator/src/bench.ts (pnpm --filter @itp/simulator bench -- --messages 100000). The first measurement, on a 2 vCPU cloud VM, gave about 10,000 messages a second over three runs of 100,000 messages, with all 200,001 readings stored.',
          'A later baseline on an Apple M3 Pro, with the service on the host and PostgreSQL 17 and Mosquitto in Docker, measured a median of 24,554 messages a second over three runs of 200,000 messages, again with every reading stored and no sequence gap. The two are not comparable: the machine, the PostgreSQL version and the commit differ. docs/benchmarks.md records both setups, and bash deploy/bench/run-baseline.sh --runs 3 --messages 200000 repeats the baseline.',
          'Completeness is measured too: devices send a monotonically increasing seq and telemetry_sequence_gaps_total counts every lost message from a ledger in PostgreSQL, so the count holds across replicas. In the first benchmark it caught a broker silently dropping 10% of a burst under default settings.',
          'pnpm e2e:ingest runs the service against a real PostgreSQL and a real Mosquitto with a fake ops-command-center: storage, duplicates, rejections, alert open, deliver, clear and resolve, gaps, and drain on shutdown. The repository also ships Kubernetes manifests with an HPA and a PodDisruptionBudget, which CI validates with kubeconform.',
          'The limits are written down as well: acknowledging on receipt means a hard kill can lose the readings of one flush window, and zero loss would need a durable log in front (ADR-0002).',
        ],
        run: {
          intro:
            'One command brings up PostgreSQL, Mosquitto, the ingest service and a simulator running the server-room-overheat scenario. The alert opens about 25 s after start and clears about a minute later.',
          commands:
            'pnpm docker:demo\ncurl localhost:3100/api/alerts                    # opens ~25 s after start, clears about a minute later\ncurl "localhost:3100/api/devices/dc-env-01/readings?metric=temperature_c"\ncurl localhost:3100/metrics | grep telemetry_     # throughput, rejections, gaps, lag\nopen http://localhost:3100/api/docs               # OpenAPI (API_DOCS_ENABLED, on in the demo)',
        },
      },
    },
    {
      id: 'aws',
      name: 'Platform on AWS',
      repo: `${GH}/platform-aws`,
      what: 'Both systems described as AWS CDK code: containers on ECS Fargate, RDS PostgreSQL, AWS IoT Core for devices, CloudFront and WAF in front.',
      proof:
        'cdk-nag security rules pass on every synth, least privilege is asserted in tests, and deploys use GitHub OIDC with no stored keys.',
      checks: [
        'cdk-nag security rules pass on every synth',
        'Least privilege is asserted in tests',
        'Deploys use GitHub OIDC with no stored keys',
      ],
      stat: { value: 'cdk-nag', label: 'security rules pass on every synth' },
      statSource: 'cdk-nag security rules pass on every synth',
      stack: ['AWS CDK', 'TypeScript', 'ECS Fargate', 'RDS', 'IoT Core', 'CloudFront'],
    },
    {
      id: 'adr',
      name: 'Architecture Decisions',
      repo: `${GH}/architecture-decisions`,
      what: 'The written design of the platform: C4 views, the decisions that cross system boundaries, and how a decision gets reviewed.',
      proof:
        'Twelve decision records with the options that were rejected and why, including one superseded when its assumption turned out wrong.',
      checks: [
        'Twelve decision records with the options that were rejected and why',
        'Including one superseded when its assumption turned out wrong',
      ],
      stat: { value: '12', label: 'decision records' },
      statSource: 'Twelve decision records',
      stack: ['ADRs', 'C4 model', 'Mermaid'],
    },
    {
      id: 'pipelines',
      name: 'Claude Code Pipelines',
      repo: `${GH}/claude-code-pipelines`,
      what: 'The AI-assisted workflow both systems were built with: each job is analysed, planned, applied and verified in separate stages a person can review and correct.',
      proof:
        'Plans are written before code, file scope is fixed, nothing is committed automatically, and real runs are published next to the commits they produced.',
      checks: [
        'Plans are written before code',
        'File scope is fixed',
        'Nothing is committed automatically',
        'Real runs are published next to the commits they produced',
      ],
      stat: { value: 'Plan first', label: 'plans are written before code' },
      statSource: 'Plans are written before code',
      stack: ['Claude Code plugin', 'Markdown artifacts'],
    },
  ],

  architecture: {
    title: 'How the pieces fit together',
    summary:
      'Readings flow from devices to the control room through two repositories. The third describes where both run.',
    nodes: [
      { name: 'Sensors', note: 'Campus devices' },
      { project: 'telemetry', note: 'NestJS · PostgreSQL' },
      { project: 'occ', note: 'NestJS · React' },
      { name: 'Operators', note: 'Control room' },
    ],
    flows: ['MQTT 5 · ~10k msg/s per replica', 'alerts through an outbox', 'live incidents'],
    platform: {
      project: 'aws',
      services: ['ECS Fargate', 'RDS PostgreSQL', 'IoT Core', 'CloudFront and WAF'],
      note: 'all described as AWS CDK code',
    },
  },

  experience: [
    {
      company: 'Surbana Jurong',
      title: 'Full-stack Engineer',
      start: '2024-04',
      summary:
        'I lead a team of three or more developers across about 50 repositories and services, turning requirements from the project manager into detailed designs and implementation plans.',
      work: [
        {
          name: 'Integrated Command Platform',
          context:
            'Command-center portal for operations in Singapore: an operator console and a multi-screen video wall with live cameras, maps and incidents.',
          points: [
            'Designed the monorepo architecture (pnpm workspaces and Turborepo): **two apps and nine shared packages**.',
            'Broke the full scope into **44 implementation-ready tickets** across every feature epic, checked against the Figma designs.',
            'Designed the live **camera integration**, relayed to browsers by MediaMTX behind an adapter, so mock and production sources switch by configuration.',
            'Set the key technical decisions: **2D maps with MapLibre and deck.gl**, **single sign-on** with an in-app permission model, and a **single on-prem Docker Compose deployment**.',
            'Still building the **operator-view app hands-on**.',
          ],
        },
        {
          name: 'IoT building-management platform',
          context: 'Backend that processes and serves IoT data for an automated building-management system.',
          points: [
            'Primary developer of the **core data processing and provisioning features** (Node.js, TypeORM, PostgreSQL).',
            'Shipped services as **Docker images to AWS ECR**, running on **Kubernetes**; reviewed the team’s code and tests.',
          ],
          link: { label: 'Related open-source work', href: `${GH}/iot-telemetry-pipeline` },
        },
        {
          name: 'AI-assisted engineering workflow',
          points: [
            'Designed and maintain the team’s **Claude Code pipelines** used daily on NestJS, Angular and React code: **diff-scoped self-review** before PM review, **API documentation with drift detection**, test and lint scaffolding, and the **ticket pipeline** that delivered the command-center monorepo.',
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
            '**Brandtmall, three years**: built the AWS ECS services that keep Tmall listings in sync (S3, DynamoDB, AWS Translate); in phase two, **led the move from JavaScript to TypeScript microservices** on MySQL and owned image processing.',
            '**Sole core developer** of an eBay US listing service and core developer of a 95Point integration, owning staging and production releases.',
            '**Primary developer** of the Mercari integration and developer and code reviewer on the Yahoo Shopping integration (TypeScript, AWS CDK, RDS, TypeORM).',
            'Proposed, built and ran an **internal serverless tool** (API Gateway, React, CloudFront) that replaced direct edits of files on S3 with controlled, auditable updates.',
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
            'Web APIs with **ASP.NET Core** and Entity Framework Core, and **Angular** UI, for an AI-driven web platform.',
          ],
        },
      ],
    },
    {
      company: 'HHD Group',
      title: 'Mobile Developer',
      start: '2018-12',
      end: '2020-02',
      work: [{ points: ['**React Native** apps connected to the company’s ERP system.'] }],
    },
  ],

  skills: [
    {
      kind: 'backend',
      name: 'Backend',
      items: [
        'Node.js',
        'NestJS',
        'TypeScript',
        'TypeORM',
        'REST and OpenAPI',
        'Microservices',
        'Event-driven design',
        'OIDC and single sign-on',
        'Socket.IO',
        'MQTT',
        'RTSP and ONVIF streaming',
      ],
      usedIn: ['Ops Command Center', 'IoT Telemetry Pipeline', 'Surbana Jurong', 'NewIT Vietnam'],
    },
    {
      kind: 'frontend',
      name: 'Frontend',
      items: ['React', 'Angular', 'TanStack Query', 'Zustand', 'RxJS', 'Redux Saga', 'MapLibre', 'deck.gl'],
      usedIn: ['Ops Command Center', 'Surbana Jurong'],
    },
    {
      kind: 'data',
      name: 'Data',
      items: ['PostgreSQL', 'MySQL', 'DynamoDB'],
      usedIn: ['IoT Telemetry Pipeline', 'NewIT Vietnam'],
    },
    {
      kind: 'cloud',
      name: 'Cloud and DevOps',
      items: [
        'AWS (ECS, CDK, RDS, S3, CloudFront, IoT Core)',
        'Docker',
        'Kubernetes',
        'Infrastructure as code',
        'CI/CD with GitHub Actions',
        'Prometheus',
      ],
      usedIn: ['Platform on AWS', 'Surbana Jurong'],
    },
    {
      kind: 'practice',
      name: 'Ways of working',
      items: [
        'System design and C4 modelling',
        'Architecture decision records',
        'Ticket-level planning',
        'Code review',
        'pnpm and Turborepo monorepos',
        'Playwright and unit testing',
        'AI-assisted delivery with Claude Code',
      ],
      usedIn: ['Architecture Decisions', 'Claude Code Pipelines', 'Surbana Jurong'],
    },
  ],

  principles: [
    {
      title: 'Design is written down',
      body: 'Decisions and tickets are documented and reviewed before code is written.',
      evidence: [
        {
          text: 'Broke the full scope into 44 implementation-ready tickets across every feature epic, checked against the Figma designs.',
          source: 'Integrated Command Platform, Surbana Jurong',
        },
        {
          text: 'Twelve decision records with the options that were rejected and why.',
          source: 'Architecture Decisions, public repository',
        },
      ],
    },
    {
      title: 'Simple scales',
      body: 'Framework-native solutions first; every new tool has to earn its place.',
      evidence: [
        {
          text: 'A single on-prem Docker Compose deployment.',
          source: 'Integrated Command Platform, Surbana Jurong',
        },
        {
          text: 'Mock and production sources switch by configuration.',
          source: 'Camera integration, Integrated Command Platform',
        },
      ],
    },
    {
      title: 'Standards are a team asset',
      body: 'Shared conventions and automated review let a small team move quickly across many repositories.',
      evidence: [
        {
          text: 'Claude Code pipelines used daily on NestJS, Angular and React code: diff-scoped self-review before PM review.',
          source: 'AI-assisted engineering workflow, Surbana Jurong',
        },
        {
          text: 'API documentation with drift detection.',
          source: 'AI-assisted engineering workflow, Surbana Jurong',
        },
      ],
    },
    {
      title: 'Leads still ship',
      body: 'I stay in the code, because good decisions come from knowing where the real complexity is.',
      evidence: [
        {
          text: 'Still building the operator-view app hands-on.',
          source: 'Integrated Command Platform, Surbana Jurong',
        },
        {
          text: 'Primary developer of the core data processing and provisioning features.',
          source: 'IoT building-management platform, Surbana Jurong',
        },
      ],
    },
  ],

  leadership: {
    figures: [
      { value: '3+', label: 'engineers led' },
      { value: '~50', label: 'repositories and services' },
    ],
    owns: [
      'Turning requirements from the project manager into detailed designs and implementation plans',
      'Reviewing the team’s code and tests',
      'The team’s AI-assisted engineering workflow',
    ],
  },

  education: {
    school: 'Ton Duc Thang University',
    detail: 'Computer Science, not completed',
    start: 2014,
    end: 2018,
  },
  languages: [
    { name: 'Vietnamese', level: 'Native' },
    {
      name: 'English',
      level: 'Working level',
      detail: 'Reads and writes technical documentation; speaks well enough for day-to-day work',
    },
  ],
};
