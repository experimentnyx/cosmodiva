# Cosmodiva — Redesign Decisions

Running log of architecture decisions for migrating the Webflow export to the new
design while preserving CMS content. Newest decisions appended at the bottom.

## Context (established 2026-07-19)

- Static Webflow export, hosted on Vercel as flat files. No `vercel.json`, no build step.
- New design currently exists on **one page only**: `index.html` (hand-written `ld-*`
  classes, ~387 lines appended to `css/cosmo-diva.webflow.css`).
  Sections: hero, about, training, pricing, food, faq, reviews, footer.
- All other pages still use the old Webflow design: `food-blog.html`, 3 recipe pages,
  `trainings-list.html`, 5 training pages, and the auth set.
- Content ("the database") is 4 CSVs exported from Webflow:
  **3 recipes**, 5 trainings, 3 food categories, 3 training categories.
- 22 asset URLs still point at `uploads-ssl.webflow.com` (recipe photos, training
  thumbnails). These die when the Webflow site is unpublished.
- Webflow User Accounts pages (`log-in`, `sign-up`, `user-account`, `reset-password`,
  `update-password`) are non-functional outside Webflow — that feature is server-side.
- `_tmp_astro/` is **not** an Astro.js attempt — it is an *astronaut* graphic extracted
  from `Untitled.fig`. Related: `astronaut-banner.html` (92KB of absolutely-positioned
  Figma export for a 339x296px graphic).
- Toolchain on this machine: git 2.55 only. **No node, no npm.**

---

## D1 — Content ownership model: files in repo, not a headless CMS

**Decision:** Option (A). Recipe/training content lives as structured data (JSON or
Markdown) in the repository. A generation step turns that data into pages. Adding
content = edit a file, commit, deploy.

**Rejected:**
- *(B) Headless CMS (Sanity/Contentful/Payload)* — expensive ceremony for 3 items with
  a single technical owner. Recurring cost and setup burden buys nothing at this scale.
- *(C) Hand-write 3 pages, drop the data layer* — loses the single-template property;
  the three recipe pages would keep diverging as they already have.

**Rationale:** With a solo technical owner and ~8 content items, in-repo data gives the
thing that actually matters — one template instead of N divergent HTML files — at near
zero cost. The JSON shape doubles as a future CMS schema, so (B) stays a clean upgrade
path if a non-technical author ever needs to publish.

**Revisit if:** a non-technical person needs to publish content without git access, or
item count passes ~50.

---

## D2 — Build with a static site generator (Eleventy), Node toolchain installed

**Decision:** Option (A1). Install Node and generate pages from data with a static site
generator. Node.js LTS v24.18.0 / npm 11.16.0 installed via winget (official `OpenJS`
publisher) and verified on 2026-07-19.

Eleventy is the recommended generator (accepted implicitly with A1 — flag if you'd
rather use Astro). One `recipe` template + one `training` template, existing CSS reused
as-is, zero client-side JS by default.

**Rejected:**
- *(A2) Generate flat HTML once, commit the output, no toolchain* — this is the state
  the project is already in, and it is precisely why the redesign stalled on one page.
  Three recipe pages that drifted apart is the symptom of having no real template.
- *(A3) Client-side render from JSON at runtime* — disqualified on SEO. Recipes are the
  content type people reach from search; client-rendered pages forfeit that traffic.

**Accepted cost:** the project gains `package.json` / `node_modules` / a build that must
succeed before deploy. It is no longer openable by double-clicking `index.html`.

---

## Finding F1 — the training content is placeholder, not real data

Verified against `Cosmo Diva Trainings.csv`:

- **1 unique description across all 5 trainings** (a generic "training with your own
  weight" blurb, attached even to specific items like *Біцепс стегна*).
- **1 unique preview image across all 5** (`..._Banner-1.png`).
- Video URLs are unrelated public videos: `vimeo.com/37058542`, `/45698221`,
  `/153138303`, `/123152125`, plus one YouTube playlist. None are Anastasiia's footage.

**Implication:** "the old database" is really **3 real recipes**. The training
collection is Webflow demo scaffolding and should be treated as a schema to fill, not
content to preserve.

---

## Open — access control has no implementation after leaving Webflow

Not yet decided. Recorded here because it blocks scope:

- `index.html` sells **8 courses, 1900–4500 UAH**. Every card promises
  *"Доступ до особистого кабінету"* and *"Доступ до матеріалу"*.
- All 8 "Обрати" buttons are `href="#"` — there is no checkout anywhere on the site.
- `access-denied.html` ("Цей курс недоступний") is Webflow's paid-membership gate.
  The auth pages (`log-in`, `sign-up`, `user-account`, `reset-password`,
  `update-password`) depend on Webflow User Accounts, a **server-side** feature that
  does not exist on Vercel. Those 5 pages are currently inert.

So the site advertises paid, gated content while having neither payment nor gating.

---

## D3 — Site collapses to three page types

**Decision:** Keep only pages that exist in the new design: **Main**, **Blog** (recipe
listing), **Blog post** (recipe detail). Delete everything else.

Interpreting "Blog" as the recipe collection — the design's *"Рецептики"*,
*"Дивитись усі рецепти"* and *"Дивитись рецепт ↗"* all point at recipes, and recipes are
the only real content (see F1). Correct this if "Blog" meant something else.

**To delete (23 files):**
- Auth set: `log-in`, `sign-up`, `reset-password`, `update-password`, `user-account`
- Gate/error: `access-denied`, `401`, `404` *(see open question — 404 may be worth keeping)*
- Trainings: `trainings-list`, `training-{vstup,ruki,spina,kvadriceps,biceps-stegna}`,
  `training-with-your-weight`, `mfr`, `stretching`
- Webflow scaffolding: `detail_food`, `detail_training`, `detail_categories`,
  `detail_training-category`, `style-guide`
- Old recipe pages: `food-{bounty,sirna-zapikanka,shokoladniy-biskvit}` — replaced by
  generated output from the data layer, not deleted content

**Consequence:** the training CMS collection is dropped entirely. Consistent with F1 —
it was placeholder data pointing at unrelated public videos.

---

## D4 — Three purchase options, not eight

**Decision:** Pricing shows exactly **3 cards**, matching `Dark Landing.png`:
Розтяжка / Тренування із власною вагою / Міо-фасціальний реліз (МФР) — **2500 ГРН** each.

The current `index.html` has **8** cards. The extra five (individual coaching, meal plan,
and three bundles) are dropped.

---

## D5 — Payment: hosted checkout link, manual fulfillment

**Decision:** Model (2). "Придбати"/"Обрати" buttons link to a hosted checkout page.
No user accounts, no automated gating, no backend. After payment Anastasiia delivers
course access by hand.

Site stays fully static — compatible with D2 (Eleventy).

**Still to pick:** the provider. Ukrainian market — Fondy, WayForPay, LiqPay, or Monobank
acquiring. Stripe does not properly serve Ukraine.

**Rejected:** *(3) real auth + paywall* — deferred, not refused. Building a paywall before
the course footage exists is building a vault for an empty room. Revisit when sales
volume justifies automating fulfillment.

---

## F2 — Why `index.html` looks nothing like the design: it was built from a stale export

The real design is a **Claude Design project** — "Anastasiia Landing", 3 pages, generated
from `Untitled.fig`:
`claude.ai/design/p/18f8924d-c395-4f05-b368-01cb82010971`
Files: `Anastasiia Landing.dc.html`, `Blog.dc.html`, `Blog Post.dc.html`.

`index.html` was never built from it. Three compounding causes:

1. **Different source.** `index.html` was reconstructed by eye from `Dark Landing.png`, a
   flat Figma export. The live design is the `.dc.html` set, which has been iterated
   repeatedly since that PNG — its visible edit history includes a logo line-spacing fix,
   a hero contre-jour/vignette so the model's hair separates from the navy background, a
   fix for "GAIN MORE" clipping under `overflow:hidden`, pricing-card height alignment,
   and bumping the "Що включає в себе:" label from 12px to 14–16px. None of that exists
   in `index.html`.

2. **The content diverged.** Live design shows **2800 ГРН**; `index.html` and
   `Dark Landing.png` both say 2500. Live pricing features read *"Щоденна підтримка в
   чаті / Доступ до матеріалу / Доступ до особистого кабінету"*, and the edit history
   references *"Доступ до приватного Telegram-каналу"*. `index.html` has 8 cards with
   different copy again.

3. **No shared tokens.** `index.html` is ~387 lines of hand-written CSS appended to the
   3,100-line dead Webflow stylesheet, scoped under `.ld-page`. Measured live at 1440px:
   hero is **1425×562 full-bleed** with an **84px** Oswald title, reusing a leftover
   Webflow asset (`images/Frame-2609295.png`). The design's hero is a *contained* photo
   composition. The two share no values.

**Conclusion:** `index.html` is a copy of a copy, one design generation stale. It is not
fixable by adjustment — it should be replaced by the `.dc.html` output.

**Caveat recorded:** the preview was only observable at ~950px wide, where the design
shows a centred hero and hamburger nav. That is likely a responsive breakpoint, **not**
the desktop composition. Do not treat the narrow layout as authoritative until seen at
1440px.

**Extraction blocked:** the rendered design is served cross-origin from
`claudeusercontent.com`; the browser guard blocks reading its HTML, and that guard was
not worked around. The files must come from you.

---

## F3 — What is actually in `Сайт з Figma файлу.zip` (64MB, 62 entries)

**Contents:** `Anastasiia Landing.dc.html` (129KB), `Blog.dc.html` (19KB),
`Blog Post.dc.html` (18KB), `support.js` (64KB), `image-slot.js` (64KB),
`components/Components.bundle.js` (126KB), `figma-export/` (astronaut + `fig-assets.css`),
`assets/` and `uploads/` — 25 jpg, 19 png, 3 svg. **All images are present**, including
`hero-photo-1/2.png`, `about-photo.jpg`, `training-bodyweight/stretching.png`,
`testimonial-main.jpg`, `banner-space-bg.jpg`, 4 avatars, and 8 blog food photos.

**These are not portable HTML files.** They are Claude Design's own format:

- Custom elements `<x-dc>` and `<helmet>`; requires `<script src="./support.js">`.
- **423 inline `style` attributes**. Zero CSS classes, zero stylesheet, zero media queries.
- **106 distinct `{{ }}` template variables** interpolated at runtime.
- **Responsiveness is JavaScript, not CSS.** One binary breakpoint:
  `const mobile = window.innerWidth <= 1100`. Layout is recomputed on `resize` and
  re-interpolated into inline styles — including flex `order` swaps.

This confirms F2's caveat: the centred hero + hamburger I saw at ~950px was the **mobile**
layout. Desktop is >1100px. There is no tablet layout.

### The valuable part: it ships a complete design token system

The runtime builds `h` / `g` / `al` / `d` / `f` / `order` objects holding **explicit
desktop and mobile values for every dimension**. Verbatim examples:

| token | desktop | mobile |
|---|---|---|
| `h.heroSection` | 1024px | auto |
| `h.heroBody` | 540px | auto |
| `h.aboutImg` | 767px | 340px |
| `h.trainImg` | 449px | 220px |
| `h.recipeImg` | 596px | 260px |
| `h.reviewsMain` | 524px | 220px |
| `g.heroSectionGap` | 160px | 0px |
| `g.headerPad` | 20px 40px | 12px 20px |
| `g.aboutPad` | 80px 40px | 48px 20px |
| `g.bannerPad` | 98px 56px | 32px 24px |
| `al.hero` | left | center |
| `order.stats` | 0 | 2 |

**Every number is stated.** Nothing needs to be measured off a screenshot. This is better
fidelity than the Figma API would have given, and it makes a proper port *cheap* — these
map 1:1 onto CSS custom properties plus a single `@media (max-width:1100px)` block.

### Also found

- A **contact-form modal** with real state (`name` / `email` / `message`, `contactSent`),
  opened by the banner's "Дроп мі е меседж". It has no backend — submission target is
  undecided.
- `Blog.dc.html` shows **8 stock recipes** (bigmac, fish, fruit, omelette, pasta, ribs,
  salad, soup). The real collection is **3** (see F1).

---

## D7 — Port the design properly (P3), using the `.dc.html` token system as the spec

**Decision:** Option P3. Translate the Claude Design output into a real static site:

- `h` / `g` / `al` / `d` / `f` / `order` tokens → CSS custom properties
- 423 inline `style` attributes → real CSS classes
- the `window.innerWidth <= 1100` JS boolean → one `@media (max-width:1100px)` block
- `Blog Post.dc.html` → an Eleventy template driven by recipe data
- copy and pricing → data files, not markup

The `.dc.html` files are kept in the repo as `design-reference/` so the drift described in
F2 cannot recur.

**Rejected:**
- *(P1) ship `.dc.html` as-is* — cannot render without JS, no data layer, and a price
  change means editing inline markup inside a 129KB file. Directly contradicts D1/D2.
- *(P2) bake the rendered DOM to flat HTML* — removes the JS dependency but destroys
  responsiveness, since the breakpoint logic *is* the JS. Would ship desktop-only.

**Decisive factor:** the stated requirement that **pricing and text will change over
time**. P1 makes routine copy edits a markup-archaeology exercise; P3 makes them a
one-line data edit. The usual objection to P3 — that a faithful port is expensive — does
not apply here, because F3's token objects supply every value outright. The costly part of
a port is knowing the numbers, and the numbers are given.

---

## Implementation status (2026-07-19)

**Done — landing page ported and verified.**

Stack: Eleventy 3 + Nunjucks, no client framework. `npm run dev` / `npm run build`.

```
src/_data/site.json      all copy + pricing (D1: edit here, not markup)
src/_data/recipes.json   generated from the Webflow CSV
src/css/tokens.css       the h/g/al/d/f/order tokens as custom properties
src/css/main.css         423 inline styles -> classes
src/index.njk            landing page
src/js/site.js           nav, modal, reveal, back-to-top (layout is pure CSS)
design-reference/        the 3 .dc.html files, kept so F2 drift cannot recur
scripts/import-recipes.mjs
```

**Verified at 1440px** — every dimension matches its token exactly:
hero 1024px, about media 656×767, program media 656×449, banner 404px,
price card 421px, recipe media 596px, reviews photo 524px, hero title 110px.
3 price cards, 3 recipe cards, 16/16 images load, no console errors.

**Verified at 420px** — title 40px, nav hidden, hamburger shown, hero photo
relative 300px, stats row, astronaut hidden, **no horizontal overflow**.
Mobile nav opens/closes; contact modal opens/closes.

**Recipe photos rescued.** All 3 downloaded off `uploads-ssl.webflow.com` into
`src/assets/recipes/`. The Webflow CDN dependency is now severed.

**One defect fixed beyond the design.** The design set `.cd-price-name`
`min-height:78px` (2 lines at 32px/1.2), but the longest plan name —
"Доступ до приватного Telegram-каналу" — wraps to 3, dropping that card's price
below the others. This is the same misalignment raised in the design review;
their fix was incomplete. Raised to 116px, and prices now share an offset
(measured: 442/442/442). Reset to 0 on mobile where cards stack.

## D8 — Recipe grid rebuilt for the real collection size

**Decision:** Option (a). The design assumed 8 recipes in a fixed
`repeat(3, 1fr)`; with 3 real recipes (one featured) a fixed 3-column track
leaves visible empty cells that read as an unfinished page.

Replaced with `repeat(auto-fit, minmax(340px, 1fr))`. Empty tracks collapse, so
any count fills the row evenly — measured at 1440px with 2 cards:
`656.5px 656.5px 0px`. Still tops out at 3 columns as the collection grows, so
this reverses itself when recipe #4 arrives; no future edit needed.

**Two further content gaps found in the real data, handled the same way:**

- **All 3 recipes share one category** (`desserts`). The design ships a 5-way
  filter (Всі / Основні страви / Десерти / Супи / Салати). A filter with one
  real option is theatre, so it renders only when the data spans 2+ categories,
  and is generated from actual categories rather than hardcoded.
- **Every `Description` field is empty**, and the design's cards have a
  description line. Rather than an empty gap, cards fall back to a macro
  summary ("45 хв · 27 г білка · 58 г вуглеводів · 35 г жирів").
- **Detail pages show 3 photos** in the design; the CMS `Images` gallery column
  is empty, so each recipe has only its main photo. The secondary photo row
  renders conditionally.

---

## Blog + recipe pages done, old site removed (2026-07-19)

Built: `/`, `/blog/`, and one page per recipe (`/blog/bounty/`,
`/blog/sirna-zapikanka/`, `/blog/shokoladniy-biskvit/`). All 5 return 200 and
every internal link resolves.

**Verified at 1440px:** blog heading 56px, featured image 500px, featured body
380px, post title 64px, photos column 770px, main photo 770×558 — all matching
tokens. Webflow rich text renders as proper `<ul>`/`<ol>` (9 ingredient items on
Баунті). **At 420px:** post title 40px, no horizontal overflow.

**Deleted** (per D3, user-authorised): 28 old HTML pages plus `css/`, `js/`,
`images/`, `documents/`, `fonts/`, `_tmp_astro/` — ~16MB of dead Webflow output.
Nothing under `src/` referenced any of it (verified before deletion).

The uncommitted rejected `index.html` and modified `cosmo-diva.webflow.css` were
backed up to the session scratchpad (`rejected-design/`) before removal, since
those edits existed nowhere in git.

**Added** `vercel.json` — `buildCommand: npm run build`, `outputDirectory: _site`,
`cleanUrls`, `trailingSlash`. Vercel was serving flat files; it must now run the
Eleventy build.

## D9 — Images: WebP at rendered size, 21.6MB → 1.06MB

**Decision:** Convert to WebP and size against the slot each image actually
renders into (per `tokens.css`), not the source dimensions. `scripts/optimize-images.mjs`.

The Figma assets came out at full resolution regardless of use —
`testimonial-main.jpg` was **2731×4096 (7.4MB)** for a slot rendering at 807×524,
and the avatars were 480px tall for **40×40** slots.

| | before | after |
|---|---|---|
| hero-photo-2 | 4251KB | 58KB (1x) + 212KB (2x) |
| testimonial-main | 7437KB | 30KB + 167KB |
| training-stretching | 3100KB | 43KB + 115KB |
| about-photo-real | 2421KB | 37KB + 78KB |
| training-bodyweight | 1542KB | 21KB + 57KB |
| banner-space-bg | 886KB | 118KB |
| 4 avatars | 169KB | ~6KB total |
| **total `src/assets`** | **21.6MB** | **1.06MB** |

`<img>` elements get a 1x/2x `srcset` (via a `retina` filter) plus explicit
`width`/`height` to reserve layout space. CSS `background-image` cannot take a
srcset, so those get one file sized for the largest slot.

**Three judgement calls worth recording:**

1. **`banner-space-bg` is encoded at quality 42**, far below the others. It is a
   grainy starfield — worst case for WebP — but sits at `opacity: 0.2` behind the
   astronaut and clouds. At default quality it only reached 407KB; at q42 it is
   118KB with no visible difference. Verified on screen.
2. **`shokoladniy-biskvit` kept its original JPEG.** Re-encoding an
   already-well-compressed 506px JPEG produced a *larger* file (62KB → 63KB), so
   the script keeps whichever is smaller and rewrites `recipes.json` to match.
   Asset formats are therefore mixed, by design.
3. **Deleted as unreferenced:** the 8 stock blog photos (`assets/blog/`, ~1.5MB)
   and `recipe-bowl/pancakes/plate.jpg` (892KB). The real recipes replaced them.

**Measured in-browser:** landing page **433KB** of images at dpr=1 (16 requests,
0 broken); blog page **119KB**. Originals remain recoverable from
`Сайт з Figma файлу.zip`; recipe photos re-download via `scripts/import-recipes.mjs`.

**Known quality ceiling:** the CMS recipe photos are small at source (506–746px
wide) and the blog featured slot renders at 933px, so they upscale slightly.
Nothing to fix locally — the Webflow originals are that size. Re-shoot or
re-upload at higher resolution if it matters.

## D10 — Wide screens: full-bleed backgrounds, content stays 1440

**Decision:** Keep the layout at its authored 1440px and centred; make the section
*backgrounds* span the viewport instead.

At 2560px the page had a **553px dead gutter either side** and each section's
radial gradient stopped at the content edge, so the whole page read as a floating
card.

**Rejected — letting the layout stretch.** The design carries ~30 hard-coded pixel
widths (`--w-about-text-1: 621px`, `--w-pricing-card: 421px`, hero photo
absolutely positioned at `left:106px` against a 1440 canvas). Widening the page
would not scale any of them — it would just pull fixed blocks apart and shift the
hero photo off its composition. That is a redesign, not a fix.

**Implementation:** a `.cd-bleed::before` layer at `width:100vw; left:50%;
transform:translateX(-50%)`, applied to the sections that own a gradient or a
border — hero, about, pricing, footer. Everything else already sits on the body
colour, which extends infinitely, so it needed nothing. `body` gets
`overflow-x: hidden` to contain the 100vw layers; `.cd-page` lost its
`overflow: hidden` (it would have clipped them) — sections clip their own.

Verified at 2560px: bleed layers 2560px wide, content 1440px, no horizontal scroll.
The gradients' outer stop and the body colour are both `rgb(0,4,21)`, so the join
is invisible.

### D10a — the hero stayed boxed; `overflow:hidden` was clipping its own bleed

The first pass fixed about/pricing/footer but **not the hero**, which still read as
a box. Cause: `.cd-hero` carried `overflow: hidden` (to clip the oversized hero
photo), so its `::before` was painted at 100vw and then **clipped straight back to
the 1440 content box**.

The original verification measured the pseudo-element's computed *width* (1920px)
and passed. Width is not visibility — that was a false pass. Confirmed properly by
checking `overflow` per section: hero `hidden`, all others `visible`.

**Fix:** move the clipping down one level. `.cd-hero-photo` now spans the hero
(`inset: 0; overflow: hidden`) and does the clipping, so `.cd-hero` can be
`overflow: visible`. Child geometry was *rebased, not changed*:

| | old | new |
|---|---|---|
| img x within hero | wrapper `106px` + img `-176px` = **-70px** | img `left: -70px` |
| glow centre x | wrapper `106px` + 50% of `800px` = **506px** | `left: 506px` |

Verified after the change: `img` at exactly `-70 / -40`, size `1058×1587`, glow
centre at exactly `506` — identical to before — with hero `overflow: visible`,
photo still contained within the 1440 box, and no horizontal scroll at 2560px.
Mobile unaffected (`inset: auto`, wrapper `relative`, 300px tall, glow recentred
to `50%`).

**Lesson recorded:** for a full-bleed `::before`, assert the ancestor's `overflow`
is `visible`, not the pseudo-element's width.

---

## D11 — Burger menu was transparent because of a `backdrop-filter` containing block

**Root cause, not a colour bug.** `.cd-mobile-nav` is `position: fixed; inset: 0`,
but it was nested inside `.cd-header`, which sets `backdrop-filter: blur(20px)`.
**A `backdrop-filter` makes an element the containing block for fixed-position
descendants**, so `inset: 0` resolved against the header's own 70px height rather
than the viewport. Measured: the "fullscreen" overlay was **420×70**. Its
background was already fully opaque `rgb(0,4,21)` — it simply only painted a
70px strip, and the page showed through everywhere else.

**Fix:** moved the overlay out of the header into `partials/mobile-nav.njk`,
included at body level from the base layout. Now measures 420×900 with
`parent: BODY`. The partial carries a comment so it does not get moved back.

---

## D12 — Button audit: cross-page nav links were dead on 4 of 5 pages

**The significant find.** The shared header/footer/mobile-nav render on every page,
but their hrefs were bare fragments (`#about`, `#pricing`, `#faq`) which only
resolve on the landing page. On `/blog/` and all three recipe pages those links
did nothing — **17 dead links per page**, including the primary conversion button
"Обрати тренування". The design's own `Blog.dc.html` had this right
(`Anastasiia Landing.dc.html#about`); it was lost when the header and footer were
factored into shared partials.

**Fix:** hrefs in `site.json` are now root-relative (`/#pricing`). When already on
`/`, the browser treats them as same-document fragment navigation, so smooth
scrolling still applies — verified: no page reload, URL becomes `/#pricing`.
Footer "Головна" now points at `/` rather than `#top`. A `_navNote` key in
`site.json` records why they must not be shortened back.

**Also fixed:** every icon button (`navOpen`, `navClose`, modal `✕`, `backToTop`)
defaulted to `type="submit"`. Harmless where they currently sit, but a latent bug
the moment one lands inside a form. All now explicitly `type="button"`.

**Verified working** — anchor scrolling (all 14 in-page targets), FAQ accordions
(open/close), contact modal (opens; closes via Esc, backdrop, and ✕; restores body
scroll), back-to-top (appears past 600px, returns to top), mobile nav (opens,
locks body scroll, closes on link click and Esc, `aria-expanded` tracks state),
and cross-page nav (from `/blog/bounty/` → `/#pricing` lands on the pricing
section). **0 broken links and 0 broken anchors across all 5 pages.**

**Remaining dead `href="#"` — all intentional, none accidental:**
3× pricing "Обрати" (payment provider undecided — as in the source design),
"Дивитись всі відгуки", and the footer Instagram / Telegram links. The last three
need only URLs and could be filled in immediately.

## D13 — Reviews grid alignment

Two measured defects, both visible on the live page:

1. **Author rows did not line up.** The three cards are equal height (304px, flex
   stretch) but content stacked from the top, so a quote running to 6 lines
   instead of 5 pushed that card's avatar down. Measured offsets from card top:
   **212 / 236 / 212px**. Fixed with `margin-top: auto` on `.cd-review-author`,
   pinning attribution to the bottom of each equal-height card — now **236 /
   236 / 236**, identical absolute Y.

2. **Featured card had two 85px voids.** `justify-content: space-between` spread
   roughly 200px of content across a 524px card, leaving dead space above *and*
   below the quote. Changed to `flex-start` with `gap: 24px`; the author is
   pinned to the bottom by the same `margin-top: auto`. Stars-to-text is now
   24px, with a single trailing gap rather than two holes.

**Mobile unaffected:** the grid is `column` there and cards size to content
(304 / 328 / 304), so `margin-top: auto` has no free space to consume and the
text-to-author gap stays at 20px. No horizontal overflow.

## D14 — Reviews rebuilt as a bento grid

`.cd-reviews-main` + `.cd-reviews-grid` (two flex rows, 32px internal gap and an
80px gap between them) collapse into one `.cd-reviews-bento` CSS grid.

Six columns, so the tiles divide evenly: photo spans 4, featured quote spans 2,
each of the three small quotes spans 2 — filling a second row exactly. A single
`--g-bento` gutter (16px desktop / 12px mobile) replaces all previous spacing.
`--g-reviews` drops 80px → 32px and now only separates the header from the grid.

**Latent bug this exposed:** browsers default `<blockquote>` to
`margin: 1em 40px`, and every review tile is a `<blockquote>`. That margin was
insetting each tile 40px per side *inside its grid track* and adding 16px above —
measured gutters came out **56 / 64 / 96px** against a declared 16px gap, and
tiles rendered 358px wide in 437px tracks. It had been skewing the old flex
layout too; the tight bento just made it visible. Fixed with a
`blockquote, figure { margin: 0 }` reset.

**Verified at 1440px:** gutters uniform 16px (one 15px from sub-pixel rounding on
fractional tracks), photo and featured tile share y and height (524px), all three
cards share y and width (438px), photo's left edge matches card 1, featured's
right edge matches card 3. **At 420px:** single 380px column, 12px gutter, every
tile flush at x=20, no horizontal overflow.

## D15 — Uniform quote type size in reviews

The featured quote was 20px against 16px in the three small cards. Unified to a
single `.cd-review-text` rule at **18px** — between the two, so the large tile
keeps presence without the small cards growing much. The
`.cd-review-card .cd-review-text` override is deleted; there is now exactly one
font-size declaration for review text.

Verified: all four quotes report 18px, no tile overflows its box
(`scrollHeight === clientHeight` on all four), and the three cards remain equal
height (295px, up from 256px) with author rows still aligned.

## D16 — FAQ open/close animation

`<details>` snaps its height to `auto`, so it cannot be transitioned. The answer
is wrapped in `.cd-faq-body` (`overflow: hidden`) and driven with the Web
Animations API: 240ms open, 220ms close, `ease`. `open` is only cleared once the
collapse finishes, so native `<details>` semantics — keyboard, find-in-page,
screen readers — stay intact. `prefers-reduced-motion` bypasses the animation
entirely.

**Two bugs found and fixed while testing, neither visible without measuring:**

1. **Mid-animation clicks stranded the panel.** `open` stays `true` for the whole
   collapse, so a click during a close read as "close again". Three rapid clicks
   from closed ended *closed* instead of open. Now a click while `.is-closing`
   is treated as a reversal.

2. **Opening never actually animated.** A closed `<details>` still reports its
   intrinsic body height, so measuring `startHeight` before setting `open = true`
   returned the full height — the animation ran 85px → 85px and the item snapped
   open. Now it starts from 0 unless reversing an in-flight collapse. Confirmed
   by sampling per frame: item height eases 77 → 78 → 80 → 82 → 85 → 89 → 93 →
   98 → … → 162 on open and 162 → 161 → 159 → 156 → … → 77 on close, both
   monotonic, with downstream content moving smoothly rather than jumping.

**Measurement note:** a closed `<details>` body reports a stale non-zero
`getBoundingClientRect().height` (Chrome renders it via `content-visibility`).
Assert on the `<details>` element's height (77px collapsed), not the panel's.
An earlier check failed for this reason when the behaviour was actually correct.

**Verified:** open/close, mid-flight reversal, the item that ships `open`,
independence (opening one leaves others untouched), no stranded `.is-closing`,
and the icon rotating in step with the panel rather than after it.

### Still open

1. **Payment provider (D5)** — all 3 "Обрати" buttons are `href="#"`, as they are in
   the design itself. Needs Fondy / WayForPay / LiqPay / Monobank.
2. **Contact form has no endpoint** — currently falls back to a `mailto:` compose
   rather than showing a fake "sent" confirmation. Needs a form service, a Vercel
   function, or replacement with a Telegram link.
3. **"Доступ до особистого кабінету"** still appears on all 3 plan cards, but D3
   deletes the auth pages and D5 has no accounts. The copy promises something that
   will not exist.
4. ~~8 blog recipes in the design vs 3 real ones.~~ **Resolved — D8.**
5. **Images: 21.6MB** (task #6).

---

## D6 (superseded by F2) — `index.html` is not the baseline; rebuild from the design

**Decision:** The current `index.html` is rejected as the starting point. Rebuild the
main page against `Dark Landing.png` / `Untitled.fig`.

Concrete divergences verified against the mockup:

| Design (`Dark Landing.png`) | Current `index.html` |
|---|---|
| 3 pricing cards | **8** pricing cards |
| Header right: "Рецептики" link + "Особистий кабінет" button | only "Особистий кабінет"; "Рецептики" absent |
| FAQ expands to show equipment cards (Рол для МФР / Коврик / Гантелі) | absent entirely |
| Reviews: large photo + featured testimonial, then 3 avatar cards | different structure |
| Astronaut illustration beside FAQ | absent |
| Program blocks alternate image left / image right, with carousel arrows | no carousel |

Section *inventory* is roughly right; the *execution* is not. That pattern — right
sections, wrong proportions/typography/spacing — is what eyeballing a PNG produces.

---

## Open — contradiction: "Особистий кабінет" vs no user accounts

The design's header carries an **Особистий кабінет** (personal account) button, and the
pricing cards in the mockup still promise *"Доступ до особистого кабінету"*. But D3
deletes the auth pages and D5 has no accounts. That button currently points nowhere.

Needs resolution before the header is built.

---

## Open — recipe count vs design

`Dark Landing.png` shows a 3-card recipe row using stock food photos (Боул, Панкейки,
Тарілка). The real collection is also 3 items (Баунті, Сирна запіканка, Шоколадний
бісквіт) but with real photos. The recipe *card* fields in the design — cook time,
kcal, protein, carbs, fats — map cleanly onto the CSV columns, so the schema fits.
