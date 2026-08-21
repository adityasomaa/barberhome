# Barberhome design system

Recorded from the built site, not from intention. Every value here is one that
ships. If this file and the code disagree, the code is right and this file is
stale.

## The world

**Enamel and honed steel.** A barbershop after dark: ink walls, bone lettering,
one enamel accent, hairline rules that read as clipper-guard lines. Square
corners everywhere. Nothing soft, nothing glassy, nothing glowing.

The visual family is recognisable with all content removed: near-black ground,
a single warm orange, hairline geometry borrowed from barbershop tooling, and
one grotesque cut at tight tracking.

Dark was picked from the use scene, not from category habit. This site is
opened on a phone in the evening by someone deciding to get a haircut before
the week starts. A bright page is the wrong object in that hand at that hour.

## Colour

Twelve tokens. Defined in `src/app/globals.css`, once, in `@theme` and mirrored
on `:root` so `scripts/contrast-check.mjs` can parse them. There are no other
colour values in the codebase except two: the button hover tint `#ff835c`, and
the greys inside `scripts/generate-graphics.mjs`, which are the same tokens
written literally because that script runs outside the CSS.

| Token | Value | Role |
| --- | --- | --- |
| `--c-bg` | `#0e100f` | Page ground |
| `--c-surface` | `#171a19` | Section band, tiles |
| `--c-surface-2` | `#1f2322` | Inputs, popovers, consent panel |
| `--c-surface-3` | `#262b29` | Hover and active states |
| `--c-fg` | `#f2efe9` | Body and display text |
| `--c-muted` | `#9aa19d` | Secondary text, placeholders |
| `--c-accent` | `#ff6a3d` | The single accent |
| `--c-on-accent` | `#0e100f` | Text on accent fill |
| `--c-line` | `#2e3331` | Hairline rules, decorative only |
| `--c-line-strong` | `#6d7572` | Control borders |
| `--c-danger` | `#8e2b22` | Error surface |
| `--c-danger-fg` | `#ff8c82` | Error text |

**Strategy: restrained.** Neutrals carry the page; the accent carries exactly
one thing per surface. It appears on: the section label, the second line of the
hero headline, primary buttons, the selected calendar day, the selected time
slot, focus rings, and one gesture inside each generated tile. Nowhere else.

Ratios (all verified, all clearing AA):

- `--c-fg` on the three surfaces: 16.6 / 15.3 / 13.8
- `--c-muted` on the three surfaces: 7.2 / 6.6 / 6.0
- `--c-accent` on the three surfaces: 6.7 / 6.2 / 5.6
- `--c-on-accent` on `--c-accent`: 6.7
- `--c-danger-fg` on the three surfaces: 8.5 / 7.8 / 7.1
- `--c-line-strong` on ground and surface: 4.0 / 3.7 (non-text floor is 3.0)

`--c-line` is deliberately outside the gate. It draws hairlines between
sections and rows, never a control boundary, and holding it to 3:1 would make
every divider on the page shout.

## Type

**Neue Montreal.** Self-hosted WOFF2 from `public/fonts`, three weights (400,
500, 700), `font-display: swap`. Regular and Medium are preloaded in the root
layout because both appear above the fold.

There is no second face. No serif, no mono. Numbers that are quantities get
`font-variant-numeric: tabular-nums` through the `.tnum` / `[data-numeric]`
hook, which is what the time slots, calendar days and flap board use.

| Role | Size | Tracking | Weight |
| --- | --- | --- | --- |
| Hero headline | `clamp(2.5rem, 8.2vw, 5rem)` | `-0.045em` | 500 |
| Section headline | `clamp(2rem, 5.2vw, 3.5rem)` | `-0.035em` | 500 |
| Section label | `0.8125rem` | `0.14em`, uppercase | 500 |
| Body | `1rem`, `1.55` line height | default | 400 |
| Section description | `1.0625rem`, max `46ch` | default | 400 |
| Small print | `0.8125rem` | default | 400 |

Measure is capped everywhere: `46ch` on section descriptions, `65ch`–`68ch` on
prose, `52ch` on form notes.

## Shape and material

- **Radius: 2px, everywhere.** Buttons, inputs, tiles, popovers, the consent
  panel. The only rounded thing on the site is the consent toggle track, which
  is a switch and reads as one.
- **Borders: 1px.** `--c-line` for dividers, `--c-line-strong` for anything the
  visitor can operate.
- **Shadows** appear on three elements only: the listbox popover, the calendar
  panel and the consent panel. All are offset-plus-blur, tinted black, no
  zero-offset halos.
- **No glass, no gradients on type, no glow.** The only gradients on the site
  are inside the generated tiles: a top-left key light and a corner vignette,
  both at low opacity, both there to make separate tiles read as one family.

## Layout

- Shell `max-width: 88rem`, centred, gutter `1.25rem` / `2rem` / `3rem` at the
  three breakpoints.
- Section rhythm `clamp(4rem, 11vw, 8.5rem)`, with more space above a heading
  than below it.
- Breakpoints: 640, 768, 1024, 1280.
- Header height 4rem mobile, 4.5rem from 768.
- The hero is `calc(100svh - var(--header-h) - 1px)`, so header plus hero is
  exactly one viewport. `svh`, not `dvh`: `dvh` is correct at any instant but
  changes as browser chrome hides during a scroll, which resizes the hero out
  from under the reader.

### The section anatomy

Every section on the site uses `SectionHeader`, and it always renders the same
four parts in the same order: section label, headline, one short neutral
description, call to action. That is a fixed contract, not a default.

### Layout families

No two sections share one. Home: full-bleed hero, ruled two-column list,
bordered form panel. Services: lead header, then a 1/2/3-column tile grid.
Booking: form panel beside a narrower aside. Legal: single prose column. Footer:
centred call to action over a three-column link grid.

## The z-index scale

One scale, in `:root`. Zero raw z-index values anywhere else.

```
--z-content: 1     content
--z-raised: 10     the mobile booking bar
--z-header: 100    sticky header
--z-menu: 200      mobile menu
--z-popover: 300   calendar, listbox
--z-consent: 400   cookie banner
--z-skip: 500      skip link
--z-curtain: 600   travel curtain
--z-intro: 700     arrival loader
```

Two conflicts inside that order are resolved by state, not by numbers, which is
what keeps them true no matter how the scale is edited later:

- opening the mobile menu closes any open calendar or listbox;
- the consent banner does not render while the mobile menu is open, and the
  mobile booking bar does not render while the consent banner is asking.

The calendar is portalled to `document.body` and positioned against its
trigger's rect, so no ancestor's `overflow` can clip it and no ancestor's
stacking context can trap it. It flips above the field when there is no room
below.

## Motion

`MOTION: moderate.` One authored moment per surface, never an effect on every
element.

| Where | What | Why it earns its place |
| --- | --- | --- |
| Hero headline | Per-letter cascade, CSS keyframe, 26ms stagger | The page introducing itself, once |
| Hero backdrop | A comb field that turns to follow the pointer | The tools in a barbershop respond to the hand; desktop only |
| Sections | Reveal on scroll, 0.7s, staggered 60-80ms | Sequence, so the eye lands on the section label first |
| Route change | Curtain closes, content swaps, scroll resets, curtain opens | Hides the swap, which is the whole reason it exists |
| Arrival | Wordmark draws itself over grain | The one place the mark is the subject |
| Booking confirmed | Split-flap board settling | State transition: the request becoming a legible ticket |

Easing is `--ease-out-expo` `cubic-bezier(0.16, 1, 0.3, 1)` for entrances and
`--ease-in-expo` for exits. Timings: curtain close 620ms, open 760ms, arrival
hold 1250ms then 900ms open.

Everything above collapses under `prefers-reduced-motion: reduce`, including
the curtains, which skip straight to their end state.

No wait in any sequence depends on `requestAnimationFrame` alone. `afterDuration`
in `src/lib/utils.ts` races a timeout against rAF, because rAF stops firing in a
backgrounded tab and a curtain that stalls mid-close never reopens. Every focus
move goes through the same primitive for the same reason.

## Browser surfaces

The parts nobody draws still carry the design: text selection is accent on ink,
scrollbars are `--c-line-strong` on `--c-bg` with a 3px inset, focus rings are a
2px accent outline at 2px offset with a 2px radius, and the native date picker
indicator is suppressed because the site never uses one.

## Imagery

Every image is a deterministic SVG from `scripts/generate-graphics.mjs`. Eight
motifs from barbershop tooling: pole, comb, blade, hex tile, razor, strop, talc,
mirror. All share one ground, two hairline greys, one accent gesture, a
top-left key light and a corner vignette.

Nothing depicts a person, a face, or a haircut, and no alt text names anyone.
Alt text describes the pattern.

The wordmark is drawn geometry, not typeset text, so it is identical in the
header, footer, arrival loader, app icon and OG card, and does not wait on the
webfont.

## Voice

Indonesian. Plain, factual, second person formal (`Anda`).

Nothing on this site claims anything: no prices, no ratings, no counts, no
founding year, no testimonials, no staff names, no promised turnaround. Service
copy says what a service is, never how good or how fast. Controls name their
action. Errors name the problem and the recovery.

The one thing the copy does insist on is the mechanism: this form goes to the
shop, and the reservation is confirmed when the shop replies. That is stated on
the booking page, in the confirmation panel, and in the terms, because it is the
only promise the site is in a position to make.
