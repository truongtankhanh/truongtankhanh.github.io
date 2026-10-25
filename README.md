# truongtankhanh.github.io

My personal site and CV: **https://truongtankhanh.github.io**

It is a small React + TypeScript app that is rendered to static HTML at build time, so the page is
complete before any JavaScript runs (fast first paint, readable by search engines and CV parsers),
and React then hydrates the parts that are interactive.

## What is in it

- **Content in one typed file.** Everything on the page comes from
  [`src/content/resume.ts`](src/content/resume.ts), checked against the types in
  [`types.ts`](src/content/types.ts). Updating the CV is a data change, not a markup change.
- **A diagram of the public work.** The five repositories it links to form one platform, so they are
  shown as one: an SVG diagram with a separate narrow layout for phones, keyboard-navigable as tabs
  (arrow keys, Home, End).
- **A downloadable CV.** The `/cv/` page lays the CV out for A4, and
  [`scripts/build-pdf.js`](scripts/build-pdf.js) prints it from the built site with headless Chrome into
  `dist-pdf/`; the build that follows links it, with its size, from the pages and ships it as
  `dist/Truong_Tan_Khanh_CV.pdf`, so the PDF always matches `resume.ts`. Without that file no page links a
  download. It has no phone number.
- **Search and sharing.** The prerender writes `Person` JSON-LD, `sitemap.xml` and `robots.txt` from
  the same content file ([`src/lib/seo.ts`](src/lib/seo.ts)); the share image is `public/images/og.png`.
- **Light and dark themes** following the system setting, with a manual switch that is remembered
  and applied before first paint.
- **Tests on the content** ([`resume.test.ts`](src/content/resume.test.ts)): roles in order and with
  valid dates, every linked repository on this account, every screenshot present, and no phone number
  on the public page.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:5390
pnpm build      # client build, server build, then prerender into dist/
pnpm build:pdf  # after pnpm build: write dist/Truong_Tan_Khanh_CV.pdf (needs Chrome; set CHROME_PATH if not found)
pnpm preview    # serve dist/
```

`pnpm typecheck`, `pnpm test` and `pnpm format:check` run the same checks as CI.

## How it is deployed

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) checks formatting, types and tests,
builds, and publishes `dist/` to GitHub Pages on every push to `main`. Pull requests run the checks
without deploying.

In CI, `pnpm build:pdf` runs after `pnpm build` on the runner's Chrome, so a failed PDF blocks the deploy.

The build has three steps: `vite build` for the browser bundle, `vite build --ssr` for a Node build
of the same app, and [`scripts/prerender.js`](scripts/prerender.js), which renders the app once and
writes the HTML into `dist/index.html`, plus the JSON-LD, sitemap and robots files.

## Credits

Typeface: [Be Vietnam Pro](https://github.com/bettergui/BeVietnamPro) (SIL Open Font License),
self-hosted through Fontsource. Screenshots are from
[ops-command-center](https://github.com/truongtankhanh/ops-command-center) and
[iot-telemetry-pipeline](https://github.com/truongtankhanh/iot-telemetry-pipeline).

## License

The code is MIT licensed. The CV content (text and screenshots) is mine; please don't republish it as
your own.
