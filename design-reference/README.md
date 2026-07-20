# Handoff: Anastasiia Personal Trainer Website

## Overview
A 3-page marketing site for a personal trainer / fitness coach (Ukrainian copy): a landing page (hero, about, training programs, pricing, nutrition/recipes teaser, FAQ, reviews, footer, contact modal), a blog/recipe listing page, and a blog post (recipe detail) page.

## About the Design Files
The `.dc.html` files in this folder are **design references built in a prototyping tool** (custom `{{ }}` templating + a runtime script). They are **not meant to be copied as-is into production**. Treat them as pixel-accurate visual/behavioral specs — recreate the same look, layout, copy, and interactions in the target codebase's actual stack (React, Vue, plain HTML/CSS, etc.), using that codebase's existing conventions, build tooling, and component patterns. If no frontend stack exists yet, plain semantic HTML/CSS/JS (or React, if the team prefers component-based work) is a safe default.

To view the reference files as originally intended you'd need the prototyping tool's runtime — instead, read the **inline `style="..."` attributes directly in the HTML** for exact colors/spacing/typography (all styling is inline, nothing is in external stylesheets), and use this README for structure, copy, and behavior.

## Fidelity
**High-fidelity.** All colors, type, spacing, and copy below are final values taken directly from the design files — recreate pixel-perfectly.

## Design Tokens

**Colors**
- Background (navy): `rgb(0,4,21)`
- Background accent (lighter navy, used in radial glows): `rgb(12,27,82)`
- Primary action / accent (orange): `rgb(249,93,0)`, hover `rgb(212,79,0)`
- Secondary accent (blue, used only on small decorative icons — bullet checkmarks, FAQ toggle, back-to-top button — never on primary CTAs): `rgb(14,61,204)`, hover `rgb(11,49,163)`
- Card fill (subtle glass): `rgba(255,255,255,0.04)` with `1px solid rgba(255,255,255,0.08)` border
- Gradient card fill (pricing cards, Blog Post ingredient card, Reviews side card): `linear-gradient(147deg, rgb(18,10,63) 0%, rgba(0,4,101,0.28) 100%)`
- Body text on navy: `#fff` at full opacity for headings, `rgba(255,255,255,0.7–0.9)` for body copy
- Star rating color: `rgb(242,176,5)`

**Typography** (Google Fonts: Oswald, Inter, Montserrat, Martel Sans)
- Logo: Martel Sans 700 (26px) + Martel Sans 300 (18px) subtitle, uppercase
- Section headings / hero title: Oswald 500–600, uppercase for hero only
  - Hero title: 110px desktop / 40px mobile, weight 600
  - Section headings: 48px desktop / 28px mobile, weight 500
- Body copy: Inter 400/500, 16–18px
- Eyebrow labels (small caps tag above headings): Montserrat 600, 14px, letter-spacing 0.05em, uppercase, color orange, preceded (and for centered sections, followed) by a 32×2px orange rule
- Buttons: Inter 500, 18px desktop / 17px mobile

**Spacing / radius**
- Section padding: 80px 40px desktop / 48px 20px mobile
- Card radius: 16–20px; buttons: 8px; pills/chips: 100px (full)
- Standard gap scale: 8, 12, 16, 24, 32, 40, 48, 64, 80px

**Image treatment**
- All photographic images: `filter: grayscale(0.15) contrast(1.05)`
- Edge fade instead of a color-tint vignette: a soft `linear-gradient` from transparent to the navy background color over the last ~35% of the image (bottom edge, or the inward edge on split layouts) — no `mix-blend-mode` color casts
- Orange pill badges (kcal / category) overlaid directly on photos, top-right or bottom-left, `border-radius:100px`

## Screens

### 1. Landing page (`Anastasiia Landing.dc.html`)
Single scrolling page, max-width 1440px centered, navy background throughout.

**Header** — sticky-feeling translucent bar (`rgba(0,4,21,0.1)` + `backdrop-filter: blur(20px)`): logo left, nav links (Про мене / Тренування / Ціни / Раціон / FAQ / Відгуки), orange "Обрати тренування" CTA button right. Collapses to a hamburger + full-screen slide-in nav below 1100px viewport width.

**Hero** — desktop: two-column split. Left column: orange eyebrow ("Персональний тренер"), 3-line stacked headline "WORK / HARDER / GAIN MORE" (last line orange), description, orange CTA, then a row of 3 stats (100+ клієнтів / 18 програм / 5+ років) separated by thin vertical dividers, no boxes. Right column: bleed photo of the trainer, cropped from the top (head fully visible, crops at legs), edge-fade at the inward (left) edge and a bottom fade so the crop never hard-cuts the body. Mobile: single column, photo shown separately above the header at 300px height with a radial glow + circular mask.

**About** — orange eyebrow "Про мене", heading + bio paragraph left, portrait photo right (edge-fade treatment, rounded 20px).

**Training** — centered eyebrow+heading ("Обери тренування для себе") with rules on both sides, then 2 rows alternating image-left/image-right: photo card + program title + 3 checkmark bullets (blue circle icons) + orange "Обрати" button. A full-width gradient banner CTA sits between the two rows (blue gradient, floating astronaut illustration, "Дроп мі е меседж" button that opens a contact modal).

**Pricing** — centered eyebrow+heading, 3 pricing cards (purple gradient fill), middle one highlighted with an orange ring + "Популярний" badge. Each card: title, price, feature checklist (blue circle checks), orange CTA.

**Nutrition/Recipes teaser** — centered eyebrow+heading, ghost-outline "Дивитись усі рецепти" button (secondary style: `box-shadow: inset 0 0 0 1px #fff`, no fill), then 3 framed recipe cards (`rgba(255,255,255,0.04)` bg + border) each with a photo (orange kcal pill badge top-right), title, 4 macro chips (`rgba(255,255,255,0.06)` pill, kcal/protein/carbs/fat), orange "Дивитись рецепт" button linking to the Blog.

**FAQ** — left eyebrow+heading, accordion list (click row to expand, blue circle "+" icon rotates 135° when open, animated height via CSS grid `1fr`/`0fr` rows).

**Reviews** — heading + 5-star average + orange "Дивитись всі відгуки" button, one large photo testimonial + gradient quote card, then a row of 3 more gradient quote cards.

**Footer** — logo, nav links, "Let's train" + orange CTA, social links, copyright line. A floating circular blue "back to top" button appears after 600px of scroll.

**Contact modal** — triggered from the banner CTA: centered overlay, gradient card, name/email/message form, submits via `mailto:`.

### 2. Blog / recipe listing (`Blog.dc.html`)
Same header/footer as Landing (links point back to `Anastasiia Landing.dc.html#section`). Content: orange eyebrow "Рецепти" + heading + subtitle, a featured recipe (large photo with edge-fade + orange "Супи · 300 ккал" badge, title, description, orange CTA), then a responsive grid (3 cols desktop / 1 col mobile) of framed recipe cards — same visual treatment as the Landing page's Nutrition cards (photo + orange kcal badge, category chip, title, orange "Дивитись рецепт" button linking to `Blog Post.dc.html`). No category filter — all recipes show at once.

### 3. Blog post / recipe detail (`Blog Post.dc.html`)
Same header/footer. Orange eyebrow "Рецепт". Full-bleed hero photo (420px desktop / 260px mobile) with a bottom scrim gradient and an orange "Основні страви · 220 ккал" badge + large title overlaid at the bottom. Below: a macro stats row (prep time · protein · fat · carbs, separated by thin dividers). Below that, a two-column layout: a narrower "Інгредієнти" column (bordered on the right, or bottom-bordered stacked above on mobile) and a wide "Інструкція" column for the long instructional text — this column layout was specifically chosen to handle posts with only one photo and long-form text (no fixed-height photo grid to fight with). Footer row: publish date + orange "Назад" button back to the Blog listing.

## Interactions & Behavior
- Header/nav collapses to hamburger + full-screen slide-in panel (`translateX`) under 1100px width; re-evaluated on every `resize` event.
- Scroll-triggered fade-in (`opacity`/`translateY` transition) the first time each major section enters the viewport (Landing) or once the whole content block is near-visible (Blog, Blog Post).
- Back-to-top button fades in after `window.scrollY > 600`.
- FAQ rows: click toggles `open` state per item; answer height animates via CSS grid track sizing; "+" icon rotates.
- Contact modal: open/close state, controlled form fields, `mailto:` submission, then a "sent" confirmation view.
- All buttons have a hover state: background darkens (or lightens for ghost buttons) and lifts `translateY(-2px)`.

## State Management
- `isMobile` (derived from `window.innerWidth <= 1100`, updated on resize)
- `mobileNavOpen` (bool)
- `scrolled` (bool, drives back-to-top visibility)
- `revealed` / per-section revealed map (bools, drive scroll-in fade)
- FAQ: array of `{ q, a, open }`
- Contact form: `{ name, email, message }` + `contactOpen`/`contactSent` bools

## Assets
All images are in the bundled `assets/` folder (also `assets/blog/` for recipe photos): trainer portraits (`hero-photo-1/2.png` — transparent cutouts, `about-photo-real.png`), training photos, recipe photos, blog recipe photos, testimonial photo, avatars, banner illustrations (`banner-cloud-*.svg`, `banner-space-bg.jpg`). The floating astronaut illustration in the Training banner and the FAQ decorative illustration are pulled from a small bundled component library (`components/Components.bundle.js`, not included here) — recreate as a simple illustrative graphic or omit if not available.

## Files
- `Anastasiia Landing.dc.html` — landing page reference
- `Blog.dc.html` — recipe listing reference
- `Blog Post.dc.html` — recipe detail reference
- `assets/` — all images referenced above
