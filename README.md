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

## The CV for applications (with a phone number)

The site and its PDF never carry a phone number. The version I send to an employer who asks for it is a Word file
built from the same `resume.ts` by [`scripts/build-application-cv.mjs`](scripts/build-application-cv.mjs), with the
number added, and a second file next to it, the project portfolio (an appendix with a table of projects and a block
for each). It is not part of `pnpm build`, `pnpm test` or the deploy, and the number is never committed.

First time on a machine:

```bash
cp scripts/application-cv/private.example.json cv/private.json
```

Then open `cv/private.json` (the `cv/` folder is local and kept out of Git through `.git/info/exclude`, so add that
rule again on a fresh clone) and replace the placeholder in `phone` with the number, in the national form (a leading
zero and nine digits) or with the country code of Vietnam; spaces, dots and dashes are fine. The script refuses any
other form, and never prints what it read.

`extraProjects` holds the projects of the portfolio, the ones that only this edition has: each has a name, a company,
a duration, a role for the table, a role, and where in my own notes it was taken from, and optionally an overview, a
team, a tech stack line and a list of responsibilities (the example file shows the fields, and the script names the
position and the field of any that is wrong). A project is listed under its company; a company that is on the site is
headed with the title and the dates of that role from `resume.ts`. Without `extraProjects` only the CV is written.
`linkedin` and `overrides` are optional.

Every time:

```bash
git check-ignore -v cv/private.json   # prints the rule that keeps it out of Git
pnpm build:application-cv             # writes the CV and the portfolio in cv/application/
pnpm build:application-cv --dry-run   # same with "(phone on request)" and made-up projects, in a temporary folder
pnpm check:application-cv             # checks the two files against resume.ts and cv/private.json, lists how they differ
pnpm check:application-cv --dry-run   # makes the dry-run files, checks them and removes them; needs no private file
pnpm pdf:application-cv               # LibreOffice makes the two PDFs, checks them, copies them to cv/application/
```

The files are built from `resume.ts`, so after a change to the content, run the command again, and then the check: it
fails, naming the rule and the file, if a role, a title, a date, a career figure or the English level is not the one of
the site, if an old wording or a placeholder is left, or if the phone number is anywhere but once in the contact line.
It also lists what the application edition has that the site does not, including each fact a project marks as
`privateOnly` (a client name, an internal product name), and it proves those are in the files and not on the site.

The PDFs are made from the Word files, with LibreOffice (`brew install --cask libreoffice`) and the poppler tools
(`brew install poppler`) that read them back; without them, Word's "Save as PDF" does the job. The script converts one
file at a time, in a temporary folder with a LibreOffice profile of its own, and copies the PDFs to `cv/application/`
only if each one passes: under 300 KB (the CV) or 400 KB (the portfolio), the right number of pages (2 to 3 and 3 to 4),
A4, every font embedded, text that can be selected and reads in the order of the Word file, and the phone number once.
If one fails, `cv/` is left as it was and the folder with the PDFs is named so you can look at them.

The files I send are the four directly in `cv/`; the generator and the PDF script write in `cv/application/`. When the
files there have passed the checks and I am happy with them, the old ones go to an archive folder and the new ones take
their place under the same names:

```bash
A="cv/archive/$(date +%Y-%m-%d-%H%M)" && mkdir "$A" && mv cv/Truong_Tan_Khanh_* "$A"/ && mv cv/application/Truong_Tan_Khanh_* cv/
```

`mkdir` fails if the folder is there, so nothing is overwritten, and the `&&` stops the rest. Nothing is deleted;
run `pnpm build:application-cv` again before the next check, because that folder is empty after the move. It writes only in
`cv/application/` and does not touch the older Word files in `cv/`. Fonts are Calibri, so it looks the same on any
machine with Word. The styles are in [`scripts/application-cv/`](scripts/application-cv/); check the result in Word
before sending it.

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
