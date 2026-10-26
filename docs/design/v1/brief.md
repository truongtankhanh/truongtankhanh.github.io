# Site V1 redesign: design brief and spec

Status: **accepted** (2026-10-23), revised the same day as **V1.1** (see [V1.1 revision](#v11-revision-2026-10-23); where an older line in
the frames or mockups disagrees with V1.1, V1.1 wins). Mockups: [CV Site Redesign V1](https://claude.ai/artifact/HR6dV7YrfWcF9UyZ15vc1q)
(design canvas, private until shared from its Share menu). Source of every frame: [mockups/](mockups/); the files
keep the canvas names, so `Main.dc.html` is the light home page. They render on the canvas only (they load its
`support.js` runtime); read them for markup and values, not in a browser.

The site is Trương Tấn Khánh's public CV: React and TypeScript, prerendered to static HTML and deployed to GitHub
Pages ([README](../../../README.md)). V1 redesigns it so that a hiring manager, a recruiter or an ATS can judge the
person faster and with more confidence, without changing a single fact about them.

## Who reads it, and what each needs

| Reader                       | Time they give it | What they need                                            | Where V1 answers it                |
| ---------------------------- | ----------------- | --------------------------------------------------------- | ---------------------------------- |
| Recruiter or sourcer         | 10 seconds        | Role, level, location, one proof of scale                 | Hero and metrics strip (frame 01)  |
| Hiring manager, tech lead    | 2 minutes         | Scope of past work, ownership, tech match, how they think | Experience, skills with evidence   |
| Engineer verifying the claim | 15 minutes        | Code and decisions they can open and check                | Work cards, case study (frame 04)  |
| ATS or search crawler        | machine           | Plain text, headings, dates, structured data, a PDF       | Prerendered HTML, JSON-LD, CV PDF  |
| The owner at an interview    | n/a               | One source of truth that matches the CV and LinkedIn      | `resume.ts` feeds site, print, PDF |

## What "more CV points" means here

There is no objective CV score, so V1 uses a rubric of what makes a CV read as stronger, and each criterion gets a
change and a way to measure it. Nothing below adds a claim that is not already true and sourced.

| #   | Criterion                              | Today (from the code)                                                                                  | V1 change                                                                  | Measured by                                |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------ |
| C1  | First screen says who and what         | Name, headline and two intro paragraphs; an availability line                                          | One-sentence lead, three actions                                           | Review against frame 01 at 1440 and 390    |
| C2  | Numbers up front                       | Figures are buried in prose (10,000 msg/s, 50 repositories, 5+ marketplaces)                           | Five-figure strip, each with its source caption                            | Every figure traces to `resume.ts` (V1-02) |
| C3  | Claims can be verified                 | Five repositories with a "proof" line; no deeper page                                                  | Case study per flagship repository with decisions and a "how to check it"  | Links resolve; claims match the repo       |
| C4  | Skills tied to evidence                | Skills are bare keyword lists                                                                          | Each skill group names the work where it was used                          | Test: every "shown in" names a real item   |
| C5  | A CV file to hand over                 | PDF and DOCX sit in `cv/` and are **not** served; the site only offers Print                           | Public PDF built from the same data, linked from header, hero and contact  | CI builds it; test finds no phone number   |
| C6  | Machine readable                       | Prerendered HTML and Open Graph tags; no structured data, sitemap or robots                            | JSON-LD `Person`, sitemap, robots, per-page titles, a designed share image | Rich-result check, Lighthouse SEO          |
| C7  | Professional finish                    | Decorative contour art and an interactive diagram before any experience                                | One restrained system, real imagery, consistent spacing in both themes     | Frames 01 to 03, contrast table below      |
| C8  | Fast and accessible                    | Good base (skip link, prerender, reduced motion, dark mode)                                            | Budgets enforced in CI                                                     | Lighthouse CI; 100 accessibility target    |
| C9  | One story across CV, site and LinkedIn | Site says "Project Lead and full-stack engineer"; CV says "Project Lead / Senior Full-Stack Developer" | Q2 revised in V1.1: "Full-stack Engineer" on every surface                 | Parity test and a launch checklist         |

## Audit of the current site

Read from the code, not from a browser session, so treat visual points as hypotheses to confirm in V1-00.

**Keep.** Prerendering with hydration for the small interactive parts; skip link; theme toggle that avoids a flash;
`prefers-reduced-motion`; a typed content file with tests (dates ordered, repositories on this account, screenshots
present, no phone number); evidence-first copy ("every claim below can be checked in the code"); Be Vietnam Pro,
which covers the name's diacritics; the habit of one accent colour.

**Change.**

1. The CV files are not on the site. [`cv/`](../../../cv/) holds `Truong_Tan_Khanh_CV.pdf` and the portfolio, but
   `public/` has only the favicon and two images, and the header offers only "Print CV". The PDF also carries a
   phone number the site deliberately keeps private (`resume.test.ts`), so it cannot be copied into `public/` as is.
2. The hero is prose. A recruiter reads two paragraphs before seeing a number or a product.
3. [`Contours.tsx`](../../../src/components/Contours.tsx) is decoration that carries no information, and
   [`Platform.tsx`](../../../src/components/Platform.tsx) (278 lines) puts a diagram ahead of the experience.
4. There is nowhere to go deeper. Each repository gets a card; none gets a page that explains the decisions.
5. No `JSON-LD`, `sitemap.xml` or `robots.txt`, and the share image is a raw screenshot (`index.html`).
6. Three versions of the story exist: the site, the print stylesheet and the DOCX/PDF. They can drift.
7. The GitHub profile surfaces are thin: `truongtankhanh.github.io` and the profile repository `truongtankhanh`
   have empty descriptions (checked with `gh repo list`). Handled in V1-19, outside this repository.

**Content differences to settle (Phase 0).** The CV lists eight marketplaces, Azure Database for PostgreSQL, the
client name NUS IOC and a personal Android project (Cuisine Guide App); the site names five marketplaces and calls
the same engagement "IoT building-management platform". The site's choices may be deliberate (privacy, client
confidentiality), so V1 does not change them without an answer.

## Design direction

**One idea: evidence first.** The page leads with the person in plain type, backs it with five
sourced numbers, and lets the reader go as deep as they like. It looks like the careful engineering it describes:
calm and typographic first. The little ornament that remains (sun rays, waves, silver rims) carries the owner's personal theme, is slow, and never sits next to body text.

- **Layout.** One column of sections inside a 1120 px wrap; a sticky header; two-column splits only where they help
  (hero, feature card, section heads). Sections are bands that alternate between the paper and a white surface, each with a top rule; every section head is a short blue bar over the title, the one-line intro, and a rule underneath. The only background art is the sun rings and waves of the hero and the wave heading the contact band.
- **Palette.** Ocean blue, a deliberate personal choice by the owner (see Personal theme). Deep sea blue is the base of every band; white and silver metal surfaces and edges sit around it; metallic gold is the one warm accent; a light-blue glow marks what is live. The tokens are named `--accent`, `--accent-strong` and `--on-accent` in the frames and in code (the earlier `--pine` names were dropped because "pine" no longer describes the colour).
- **Personal theme.** The owner is Mệnh Thủy (water) and Cung Sư Tử (Leo) and asked for the interface to follow both. It is expressed only as colour, shape and motion; the site never states the owner's sign or element. Water: deep blue and black as the base, flowing shapes, and Kim (metal, which feeds Thủy) given a strong presence in white, silver and steel; no earth browns or yellows (Thổ) and no strong reds or oranges (Hỏa). Leo: gold (the sun) as the single warm accent, kept metallic so it reads as Kim rather than earth, and a slowly turning ring of sun rays behind the hero. V1.1 tones the metal down so the page reads as calm engineering rather than product packaging: cards are flat white or dark-blue surfaces with a 1 px silver rim and a soft shadow (no bevel, no hard drop shadow, no dark foot); buttons are flat with a 1 px rim and do not press down, the primary one in steel blue and, on the blue bands, in silver; the hero name and the career figures are plain silver or light ink with no shadow; corners stay firm (10 to 14 px); the line under each section title is a 2 px steel rule that fades out.
- **Type.** Be Vietnam Pro (already a dependency) for everything; the system monospace stack for small labels, so no
  new font file. Hero name 84/800, display 64/800, section 40/800, role 22/600, body 17/400.
- **Imagery.** The two screenshots already in `public/images/` appear only on the case-study page; the hero carries no photograph. No stock art, no portrait unless Q5 says so.
- **Motion budget.** Motion must never tire the eye. The rules: opacity and a small shift (14 to 16 px) only, never layout or size, so nothing jumps; each element animates once, at most 0.7 s with an ease-out curve, 1 s for the hero as a whole; the hero builds itself top to bottom on load, the five figures draw their rule and rise one after another, later blocks fade up as they enter the screen and the timeline draws itself down the page as it scrolls; the loops that remain are slow (sun 3 minutes, waves 30 and 46 s, the stack and diagram pulses about 5 to 8 s) and never sit next to body text; no parallax, no scroll hijacking, no auto-playing media, no count-up numbers. All of it is behind `prefers-reduced-motion: no-preference`, and the scroll-driven parts also behind `@supports (animation-timeline: view())`, so every browser shows the finished page.
- **Components.** Button (primary, secondary, small), chip, proof line, project card, feature card, metric,
  role row, engagement box, skill row, principle, contact band, plate (the metal card surface), silver text, logo. Frame 00 shows the set.

## Logo

The previous mark was a pulse line in a rounded square, which is a generic heartbeat symbol used by many products. The
new mark is drawn only for this site and built from the owner's initials, so it is not a stock icon. Files:
[brand/](brand/) (`logo-mark-on-dark.svg`, `logo-mark-on-light.svg`, `logo-mark-mono.svg`, `favicon.svg` and the rest of the favicon set).

- **Concept.** One glyph built from the initials of **T**rương **T**ấn **K**hánh. The two T's are the same letter, so
  they become one T; that T and the K both stand on a vertical stem, so they share it. The result is a single
  character: one upright stem, a T crossbar on top, and the K's two arms leaving the stem below the bar. The T crossbar is drawn the way wind moves cloud, as one soft wave like a brush stroke; the stem stays straight and upright, so the glyph keeps a firm spine. The stem and
  bar are silver-white (Kim). The upper arm is a gold ray that ends in a small sun (cung Sư Tử). The lower arm is a K
  leg that ends in a ripple of light blue (Mệnh Thủy). It sits on a metal plate with one corner cut at 45 degrees.
- **Construction.** A 64-unit grid, drawn to be balanced and wider than tall: the glyph measures about 39 by 30 units, its
  box centred in the plate. The stem is short (30 units) so it does not dominate; the two K arms leave the stem at the
  same point at 34 degrees above and below the horizontal and reach as far right as the crossbar's reach plus 9 units,
  so the K carries the same weight as the T; the stem foot and the leg's end sit on one baseline. Plate path
  `M12 6H46L58 18V52a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6Z`, stroke 1.6. Crossbar
  `M12 16.2C15.5 13 21 13 27 16S38.5 19 42 15.8` and stem `M27 16V46`, 4.2 wide (the crossbar sways under 1.5 units so the
  T stays a T at 16 px; the stem is straight); ray `M27 34L43.6 22.8` and leg
  `M27 34L35 40.5C38 43 40 45.5 43 45.5S47.5 43 51 44.5`, 3.8 wide; all with round caps and joins. Sun: radius 3.2 at
  (46.8, 20.2). Only the last third of the leg ripples, so the K stays legible as a K. Keep the ray at least 4 units
  below the crossbar.
- **Finish.** The mark is made of metal and drawn as raised letters. Silver strokes carry a top-to-bottom gradient (white at the
  top, pale steel in the middle, deeper steel at the foot), the gold ray a gradient from deep gold to a bright tip, the
  sun a radial gradient like a polished ball, and the wave a gradient from pale to deep blue. A hard-edged soft shadow
  (offset 1.8 units down, blur about 0.9, black at 60 % on dark and 30 % on light) lifts the letters off the plate, and a
  thin white highlight line, shifted up and left by about half a unit, runs along the top edge of the crossbar, stem and
  ray so they read as embossed. The plate has a vertical gradient fill and a rim that goes from white to steel. Gradients
  are in user-space units because the stem is a zero-width line and an object-bounding-box gradient would not paint.
  The mono file stays flat.
- **Variants.** On dark (header and hero bands), on light (the CV print and white surfaces), mono (`currentColor`, for
  stamps and one-colour print), and the favicon set (the same glyph on a solid deep-blue plate, redrawn for 16 px with heavier strokes and no shadow filter; frame 09; it stays readable at 16 px because it is one shape, not three letters).
- **Use.** Beside the name in the header at 48 x 48 px (40 x 40 px on a phone); never below 16 px; clear space of a quarter of its width on every
  side; never recoloured, stretched, outlined or placed on a busy photo. The lockup is the mark at 48 px beside two lines of text whose total height matches the mark: the name in Be Vietnam Pro 800 at 1.3 rem, and under it the role in the mono label style (0.62 rem, 0.14 em tracking, capitals, 72 % opacity), 14 px from the mark and 4 px between the lines. A single line of name alone looked small beside the mark (its capital height was about a quarter of the mark's, where a balanced lockup is 40 to 50 %). On a phone the role line is dropped and the name is 1.1 rem. There is no separate lettering.
- **Uniqueness.** The mark combines the owner's initials with the owner's own theme and has no known source. No one can
  promise from here that nothing similar exists anywhere; before using it on anything commercial, run a search in the
  trademark registers of the countries involved (for Vietnam, the national IP office database) and a reverse image
  search.

## Frames

| #   | File                                                           | What it fixes                                                                                                                                                                                                                                     | Tickets          |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 00  | [Tokens.dc.html](mockups/Tokens.dc.html)                       | Colour in both themes, type scale, component set                                                                                                                                                                                                  | V1-01            |
| 01  | [Main.dc.html](mockups/Main.dc.html)                           | Home, light: header, hero, metrics, work, experience, skills, principles, contact                                                                                                                                                                 | V1-04 to V1-07   |
| 02  | [Home-dark.dc.html](mockups/Home-dark.dc.html)                 | Home, dark (same component, `theme` prop)                                                                                                                                                                                                         | V1-08            |
| 03  | [Home-mobile.dc.html](mockups/Home-mobile.dc.html)             | Home at 390 px; breakpoints follow the container width                                                                                                                                                                                            | V1-08            |
| 04  | [Case-study.dc.html](mockups/Case-study.dc.html)               | Case study page: facts row, sticky contents, decisions, how to check it, run it                                                                                                                                                                   | V1-09 to V1-12   |
| 05  | [Print-cv.dc.html](mockups/Print-cv.dc.html)                   | Four-page A4 CV, the source of the public PDF: white, print-friendly (blue rules and light tints, nothing to the paper edge), figures box, timeline, leadership evidence, all five public repositories, skills as cards and a closing contact box | V1-13, V1-14     |
| 06  | [Share-image.dc.html](mockups/Share-image.dc.html)             | Share image, 1200 x 630: the name in silver type, the role in gold, one sentence, three figures, the logo and the address; exported once to [brand/og-image.png](brand/og-image.png)                                                              | V1-03.4          |
| 07  | [Not-found.dc.html](mockups/Not-found.dc.html)                 | Not found (404), light: the home hero treatment, the 0 drawn as the logo's sun, two actions and the four home sections                                                                                                                            | V1-09.3          |
| 08  | [Not-found-dark.dc.html](mockups/Not-found-dark.dc.html)       | The same page in dark (same component, `theme` prop)                                                                                                                                                                                              | V1-09.3          |
| 09  | [Favicon-set.dc.html](mockups/Favicon-set.dc.html)             | Favicon set: the 16 px mark, `favicon.ico`, apple-touch icon, maskable icons, tab strips on light and dark chrome, the head tags                                                                                                                  | V1-01.3          |
| 10  | [Not-found-mobile.dc.html](mockups/Not-found-mobile.dc.html)   | Not found (404) at 390 px: header with menu button, actions stacked, tiles two by two                                                                                                                                                             | V1-09.3, V1-08.1 |
| 11  | [Case-study-mobile.dc.html](mockups/Case-study-mobile.dc.html) | Case study at 390 px: facts as one column, no contents rail, decisions as a list, the code block scrolls inside its box                                                                                                                           | V1-10, V1-08.1   |

`site.css` in the same folder is the shared stylesheet the frames use; it is the reference for V1-01, not code to
copy (the real site uses the existing `src/styles.css`, reorganised).

## Home page, section by section

1. **Header.** Deep blue like the hero, so the first screen reads as one piece. The TK logo beside the name and the role on two lines; the five anchors (Work, Experience, Skills, How I work, Contact) as a centred pill-shaped segmented control whose current section is a filled light pill with a small gold dot and a soft shadow, and which follows scrolling; a round theme toggle; "Download CV" as a light pill that turns gold on hover. A thin light-blue line along the bottom fills as the page scrolls. It replaces "Print CV", which moves into the CV route.
2. **Hero.** A deep sea-blue band, full width, with a ring of gold sun rays turning very slowly in its top-right corner and two translucent waves drifting along its foot, the front one in the page colour so the band ends in a wave. Left: location and timezone as a small label, the name at 84 px on two lines, the role in metallic gold, a lead of at most four lines that says full-stack end to end (system design, backend, frontend, DevOps), the availability line (Q15), two actions (Email me as the primary button, Download CV (PDF) as the secondary one) and GitHub and LinkedIn as plain text links beside them, so one action is clearly the main one, and under a rule two facts: "Currently: Surbana Jurong, building operations platforms since April 2024, for clients in Singapore" and "Open source: 5 public repositories" with a link to the work. The left column is as tall as the stack on the right. Right: the technology stack as four layers (Frontend, Backend, Data, Cloud), each listing its tools from the CV, with the core stack (React, Angular, Node.js, TypeScript, NestJS, PostgreSQL) in solid light chips and the rest outlined, and an light-blue pulse passing down a data bus like a request: each layer steps forward and lights its edge as the pulse reaches it. The platform is tilted back slightly for depth. Along the bottom of the band, the five figures of the career strip. The screenshot is not used here: at that size its interface could not be read.
3. **Metrics (inside the hero).** Five figures with a caption saying where each comes from: 7+ years (since Dec 2018), 5+ marketplaces integrated (NewIT; the five named on the site, written as a lower bound by decision Q4), 3+ engineers led, about 50 repositories and services, and about 10,000 msg/s on one replica (open-source pipeline). They run in career order, early to recent. All five already appear in the CV or the repositories. A count of tickets was dropped: next to seven years it understates the volume of work.
4. **Public work.** One featured case study (Ops Command Center) as a dark blue card with no image: a large title, the description, the stack and two actions on the left, and on the right a short checklist, "What you can check in the code", made from the project's existing proof line split into its four claims,
   then four cards (telemetry, AWS, decisions, pipelines), each led by one key figure taken from its existing proof line, followed by its claims as ticked lines, and an architecture diagram showing how they connect (devices, telemetry pipeline, command center, operators, with the AWS platform underneath).
5. **Experience.** Dates in a left column; the current role expanded into its three engagements, earlier roles as
   short bullet lists. Text is the existing copy.
6. **Skills.** A dark core-stack band, then five groups as cards, each with a "Shown in" line naming the work where the skill was used. V1.1 adds the keywords the work already proves (microservices, event-driven design, OIDC and single sign-on, RTSP and ONVIF streaming, infrastructure as code, CI/CD, system design, code review) and renames "Cloud and delivery" to "Cloud and DevOps". The list is in `resume.ts`.
7. **How I work.** A scope card (3+ engineers led, about 50 repositories and services, what I own), the four existing principles each with one or two lines of evidence quoted from the work, then education and languages.
8. **Contact.** A full-width band. On the left a large "Let's talk" and one line (email is quickest; UTC+7). On the right one dominant action, the email address as a light card with an arrow, and three quieter tiles under it: GitHub, LinkedIn and the CV download, each with its address or format. There is no footer: the contact band is the last thing on the page.

## Case study page (frame 04)

A fixed template so each flagship repository reads the same. The head is the same deep-blue band as the home hero: breadcrumb, a small "Case study" label with the gold rule, the title at 80 px, a one-sentence lead and two actions (open the repository, run it yourself). The four facts (role, stack, status, source) are white cards that straddle the band's lower edge. Then a sticky contents list, then Overview with the demo video (Q18) and a screenshot, What it does, Decisions that
shaped it (each ADR with its real title), How to check it, Run it, and previous/next. Every sentence comes from the
repository's README or ADRs; where those do not say it, the page does not either. Frame 04 is Ops Command Center;
the others follow the same template (V1-12).

## Content rules

- **No new claims.** A number, a title or a date on the site must be in `resume.ts`, the CV, or the repository it
  links to. The metrics strip stores each figure with its source, and a test fails if a figure has none.
- **Repetition budget.** A fact is shown prominently at most twice on a page. The role title is said in the header lockup and
  the hero, and in the experience entry that states the job itself; the hero's "Currently" line gives only the company.
  The figures 3+ and ~50 live in the hero strip and the leadership block, not in the experience entries; the 44 tickets
  appear once as a bullet and once as the leadership evidence that quotes it.
- **Privacy.** No phone number anywhere public, including the PDF; the phone number lives only in the private application edition (`cv/`, which is local-only and listed in `.git/info/exclude`, so it is not in the repository). Phase 6 gives that edition the look of frame 05 and builds it from `resume.ts` plus a private data file, so the two editions cannot drift. Client and engagement names follow Q3.
- **One spelling.** `Trương Tấn Khánh` on the page (`lang="vi"`), `Truong Tan Khanh` in file names and ATS fields.
- **English only** for V1; a Vietnamese edition is out of scope.
- **Availability, stated once in the hero and once in the contact band.** "Open to remote full-stack engineering work,
  full-time, part-time or contract" (Q15, replaces the 2026-10-23 "no job-search wording" rule). The site does not
  ask for lead or management roles.
- **Sensitive details stay out** (Q23): see the V1.1 revision for the list. This applies to the site, the PDF, the case
  studies and the share image.
- **Placeholders, not inventions.** Testimonials, awards and certificates are absent because none are on record;
  the layout does not reserve space for them.

## SEO, ATS and sharing

- `<title>` per page: "Trương Tấn Khánh, Full-stack Engineer" on home; "Ops Command Center,
  case study | Trương Tấn Khánh" on case studies. One `h1` per page and a sensible `h2`/`h3` outline.
- JSON-LD `Person`: `name`, `alternateName` (ASCII), `jobTitle`, `url`, `email`, `sameAs` (GitHub, LinkedIn),
  `knowsAbout`, `worksFor`. Generated from `resume.ts`, so it cannot drift.
- `sitemap.xml` and `robots.txt` written at build time; canonical URL on every page.
- Share image 1200 × 630 (frame 06): the name, the role, one sentence and three figures on the deep-blue band, with the logo; no screenshot. Committed as `public/images/og.png`, with `og:image:alt` and `twitter:card` set to `summary_large_image`.
- The PDF is a text PDF (selectable, with the same headings), named `Truong_Tan_Khanh_CV.pdf`, built from frame 05.

## Accessibility and performance targets

- Contrast, computed from the tokens (all clear 4.5:1): light ink on paper 16.0, muted on paper 6.4, muted on wash 5.9, accent blue on paper 7.4, white on accent button 7.9, band text on band 14.0, gold on band 8.8; dark ink on paper 15.8, muted on paper 8.4, muted on wash 6.0, accent on paper 7.6, dark text on accent button 7.6, band text on band 12.3, gold on band 7.9.
- Touch targets 44 px; visible focus ring (dark gold on light surfaces, light gold on the bands and in dark mode); skip link kept; `aria-current` on the section nav.
- Lighthouse on the built home page: Performance 95 or better, Accessibility 100, Best Practices 100, SEO 100,
  measured in CI (V1-16). Largest Contentful Paint under 2 s on the CI profile; no layout shift.
- JavaScript only where it earns its place: theme toggle and the active-section highlight. No new runtime
  dependency is planned.

## Decisions (Phase 0, closed 2026-10-23)

| #   | Question                                                                                                                                                                    | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1  | The CV PDF has a phone number. Publish a public edition without it, or keep the PDF off the site and offer print only?                                                      | **Two editions.** The public edition (site and PDF, built in CI) has no phone number. The application edition, the masters in `cv/`, has the phone number and is sent by the owner by email to a recruiter or employer directly; it is never published. Recruiters who find the public one reach the owner by email or LinkedIn and get the phone number in the reply                                                                                  |
| Q2  | Title on every surface: "Project Lead and full-stack engineer" (site) or "Project Lead / Senior Full-Stack Developer" (CV)?                                                 | **Revised in V1.1: "Full-stack Engineer"** on every surface (header lockup, hero, title tag, JSON-LD, share image, CV masters, LinkedIn), including the Surbana Jurong entry. "Project Lead" and "Team Lead" are not used as a title anywhere public; leadership shows as evidence (the scope card, the leadership story), not as a title. It is the safest title to verify and says what the owner sells: system design, backend, frontend and DevOps |
| Q3  | Name the clients (NUS IOC) or keep "IoT building-management platform"?                                                                                                      | **Keep generic** (as proposed). Revised in V1.1 (Q25): the Surbana Jurong command-center project is named by an alias, "Integrated Command Platform"                                                                                                                                                                                                                                                                                                   |
| Q4  | Marketplaces: five named on the site, eight on the CV. Which list is public?                                                                                                | **Do not fix a number: write "5+"**, naming the five known ones and "and more"; the same "5+" on the site and in the print CV                                                                                                                                                                                                                                                                                                                          |
| Q5  | Add a portrait to the hero?                                                                                                                                                 | No; the hero is text only (design default, no objection)                                                                                                                                                                                                                                                                                                                                                                                               |
| Q6  | Case studies: Ops Command Center only, the three code repositories, or all five?                                                                                            | **Three** (OCC, telemetry, AWS); the other two link out (as proposed)                                                                                                                                                                                                                                                                                                                                                                                  |
| Q7  | Retire the interactive platform diagram (replaced by the architecture diagram) and the old contour art (replaced by the hero stack), or keep the diagram lower on the page? | Retire both; the strip and case studies replace it (design default, no objection)                                                                                                                                                                                                                                                                                                                                                                      |
| Q8  | Personal Android project (Cuisine Guide App) on the site?                                                                                                                   | No; it is from before the current focus (design default, no objection)                                                                                                                                                                                                                                                                                                                                                                                 |
| Q9  | Role wording on case studies ("Author and maintainer") matches how you want to be described?                                                                                | **Approved**                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Q10 | The skills "Shown in" lines and the "In practice" evidence under each leadership principle are my reading of which work backs which claim. Are they accurate?               | **Approved** as drawn                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Q15 | The site said nothing about availability.                                                                                                                                   | **Open to remote full-stack work in any arrangement** (full-time, part-time, contract); not seeking a lead or management role. Shown in the hero and the contact band. Notice period, salary and time-zone overlap are not published                                                                                                                                                                                                                   |
| Q16 | Four equal hero actions or one main action?                                                                                                                                 | **One primary (Email me), one secondary (Download CV)**; GitHub and LinkedIn as text links                                                                                                                                                                                                                                                                                                                                                             |
| Q17 | Keep the polished-metal look (bevels, hard shadows, pressed buttons)?                                                                                                       | **Tone it down** to flat surfaces with a silver rim and soft shadow; the palette, the sun rays and the waves stay (see Personal theme)                                                                                                                                                                                                                                                                                                                 |
| Q18 | A way to see the product without cloning it                                                                                                                                 | **A demo video recorded by the owner**, click to play, in `public/media/` (see V1.1). Until the file exists the page shows the screenshot and no player                                                                                                                                                                                                                                                                                                |
| Q19 | Outcome figures (time saved, users, uptime)                                                                                                                                 | **None added.** The CV has no outcome figures beyond those already on the site, so none are invented; the "No new claims" rule stands                                                                                                                                                                                                                                                                                                                  |
| Q20 | Testimonials or recommendations                                                                                                                                             | **Not needed**; stays out of scope                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Q21 | A concrete leadership story                                                                                                                                                 | **Yes**, written from the owner's command pipelines (draft in V1.1)                                                                                                                                                                                                                                                                                                                                                                                    |
| Q22 | Keywords for ATS and search                                                                                                                                                 | **Add** those the work already proves (see Skills)                                                                                                                                                                                                                                                                                                                                                                                                     |
| Q23 | Sensitive client and infrastructure details                                                                                                                                 | **Filter them** (list in V1.1)                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Q24 | "How I work" as a section name                                                                                                                                              | **"How I work"**, because the owner is not seeking a lead role; the scope card (3+ engineers, about 50 repositories) stays as evidence of seniority                                                                                                                                                                                                                                                                                                    |
| Q25 | The real project name appears on a public site                                                                                                                              | **Use the alias "Integrated Command Platform"** (short form ICP), which keeps the meaning of the original name. The employer, Surbana Jurong, stays named as on the CV. The alias is used on the site, the PDF, the case studies and the share image; the private application edition may use the real name                                                                                                                                            |

Phase 6 (application edition) adds four questions that gate it only: Q11 private-only details, Q12 LinkedIn address, Q13 the `docx` dev dependency and Q14 the font. See [phase-6-application-edition.md](tasks/phase-6-application-edition.md); each has a default there.

## V1.1 revision (2026-10-23)

Goal: a recruiter or hiring manager who opens the site should want to talk and should see a senior full-stack engineer
who can also design the system and run it. Decisions Q2 and Q3 (revised) and Q15 to Q25 above record what changed. This section
holds the working detail.

**Content changed in `resume.ts` and `index.html`.** Headline, intro, availability, keywords, "Still building" fix, the
sensitive-detail filter, and the title, description and Open Graph tags. `App.tsx` and the styles are untouched until
V1 is built.

**Sensitive-detail filter (Q23).** The project name is an alias (Q25). Removed from every public surface: the site location "Sentosa", "island-wide",
"three-projector" (now "multi-screen"), the OneMap tile source, Entra ID by name (now "single sign-on"), the reference to
the site's video management system, Azure Database for PostgreSQL, and the NUS IOC name. Open-source tool names
(MediaMTX, MapLibre, deck.gl, Keycloak) stay. The private application edition in `cv/` is not affected. Before launch the
owner still confirms that naming Surbana Jurong is allowed under the employment contract. The command-center project goes
by the alias in Q25.

**Demo video (Q18).** Recorded by the owner and in place (2026-10-23):

| File                                                | What it is                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `public/media/ops-command-center-demo.mp4`          | 87 s, 1440 x 900 (16:10), H.264, 7.1 MB, no audio track, captions burned into the frames |
| `public/images/ops-command-center-demo-poster.webp` | Frame at 0.5 s (the 3D campus view), 1440 x 900                                          |

With no audio track, the on-screen captions carry the story and the page needs only a one-line text summary. The player is a native `<video controls preload="none" poster>` with a one-line caption and a text summary of what it
shows; it never autoplays. It sits at the top of the case study; the featured card on the home page links to it with a
"Watch the demo" action. The build renders it only
when the file exists, so a missing video never leaves a broken player.

_Done 2026-10-26._ `CaseStudy.demo` in `resume.ts` holds the caption, the summary and the files; the build finds the video
through `__DEMO_VIDEO_BYTES__` (`vite.config.ts`), so the player (`<figure id="demo">` at the top of the overview) and the
"Watch the demo" action of the featured card exist only when `public/media/ops-command-center-demo.mp4` does. The
captions menu holds `ops-command-center-demo.vtt`, a note that the video has no sound; the summary is worded from the
captions burned into the frames.

**Leadership story (Q21), draft copy for the Claude Code Pipelines case study, condensed in "How I work".**
Sources: the owner's engineering-workflow notes in the private portfolio, the CV, and the
[claude-code-pipelines](https://github.com/truongtankhanh/claude-code-pipelines) README.

- _Situation._ One team of three or more developers keeps about 50 NestJS, Angular and React repositories moving, and
  every change reaches the project manager for review.
- _Action._ Designed command pipelines that split each job into gated stages (scan, plan, apply, verify) with a stop for
  human approval between them; a self-review that checks and fixes only the lines changed in the current diff before the
  project manager sees it; API documentation generated from the code with drift detection; unit, end-to-end and lint
  scaffolding that understands monorepos; and a ticket pipeline that delivered the Integrated Command Platform monorepo.
- _Result._ The team uses them daily on NestJS, Angular and React code, and every change is self-reviewed before
  project-manager review. No time or defect figures are on record, so none are shown. A public edition is published.
- _Count._ The private set is large (over 500 command files). Quote a number only if the public edition shows the same.

**Mockups (updated 2026-10-23 to V1.1).** `Main`: hero lead and availability line, hero actions (one primary, one
secondary, two text links), the sensitive-detail filter, "Still building", "How I work", the skills keywords and the
"Cloud and DevOps" group, a "Watch the demo" action on the featured card, the contact line. `Case-study` (and the mobile
frame that imports it): the demo-video frame at the top of Overview. `Print-cv`, `Share-image`, `Tokens`, `Not-found`,
`Favicon-set` and the brand files: the role line is "Full-stack Engineer", the project name is the alias. `site.css`:
flat cards and buttons (no bevel, dark foot, hard shadow or press-down), the hero action row and the demo frame.
`Home-dark` and `Home-mobile` follow through the `theme` prop and container width. `brand/og-image.png` was re-rendered
from `brand/og-image.html`. The logo keeps its embossed finish for now; revisit it if the flat UI makes it look out of
place. English level, everywhere: "Reads and writes technical documentation; speaks well enough for day-to-day work".

**P0 status (2026-10-23).** Shipped in an interim form on the current site: copy and keywords, the public CV PDF (printed from the
site's own print stylesheet by headless Chrome in CI, a simpler stand-in for V1-13 to V1-14), Download CV links in the
header, hero and contact, `og.png` with its tags, `Person` JSON-LD, sitemap and robots. The designed four-page CV and the
case studies still follow the order below.

**Build order.** P0, what a recruiter touches first: the copy above, the public CV PDF, the share image, JSON-LD, sitemap
and robots. P1: the case studies and the demo video. P2: the redesigned visual theme and the motion.

**Noted for later (not in V1.1).** GitHub profile and pinned repositories with README openings that lead with what, why,
a screenshot and how to run; the LinkedIn headline, About and Featured link aligned to the site; `?ref=` tags on links
and GitHub Insights referrers to see who visits.

## Out of scope

A blog, a CMS, analytics or cookies, a contact form, testimonials, a Vietnamese edition, a custom domain, and any
change to the facts in `resume.ts` beyond what Q1 to Q10 decide.

## Risks

| Risk                                                 | Mitigation                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Metrics read as inflated                             | Each carries its source; "about" and "+" are kept exactly as in the CV                     |
| Multi-route prerender breaks GitHub Pages deep links | Output one `index.html` per route and a `404.html` (V1-09); verify on a preview branch     |
| PDF generation needs a headless browser in CI        | Runs in CI only, never locally; if it proves flaky, commit a reviewed PDF instead (V1-14)  |
| Redesign erodes the print CV that exists today       | Print is frame 05 and its own ticket; the current print stylesheet stays until V1-13 lands |
| Case-study copy drifts from the repositories         | Copy is quoted from README and ADRs; V1-11 lists the source line for each paragraph        |
