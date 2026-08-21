# Barberhome

Company profile and booking site for Barberhome, a barbershop that until now
took reservations through a third-party platform. The point of this build is
that the shop owns the booking form.

Live: https://barberhome-id.vercel.app

---

## Before you ship this to the client

Two placeholders need real values. Nothing else on the site invents a fact.

### 1. The WhatsApp number

`src/lib/site.ts` falls back to `6281234567890`, a dummy number. Set the real
one as an environment variable, in international format, digits only, no
leading `+`:

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=628123456789
```

Set it in Vercel under Project Settings then Environment Variables, and locally
in `.env.local`. Until it is set, every `wa.me` link is structurally correct but
points at the dummy number.

### 2. The booking window

`BOOKING` in `src/lib/site.ts` defines which time slots the picker offers
(`openHour`, `closeHour`, `slotMinutes`) and how far ahead it accepts bookings
(`horizonDays`). These are picker settings, not opening hours: they are never
rendered as an "we are open from X to Y" claim anywhere on the site. Adjust them
to the shop's real schedule.

---

## Running it

```bash
npm install
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build. Runs the contrast gate first |
| `npm run graphics` | Regenerates every SVG and the OG card |
| `npm run check:contrast` | Asserts every colour pairing against WCAG AA |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Zod
for validation, Lenis for desktop smooth scrolling. Every page is statically
prerendered; the only server code is the booking action.

`images.unoptimized` is `true` in `next.config.ts`. The Vercel account's image
optimization quota is exhausted, and with the optimizer on, every image request
returns 402 and the page renders blank. Every asset here is a generated SVG, so
there is nothing for the optimizer to do anyway. Leave it on.

---

## Booking: how it works, and how to give it a real backend

There is no booking database yet, so the shipped transport composes a prefilled
WhatsApp message containing every field the visitor entered plus the page it was
sent from. The visitor presses one button and sends it themselves.

The transport sits behind one interface in `src/lib/booking-adapter.ts`:

```ts
export interface BookingAdapter {
  readonly id: string;
  submit(booking: Booking): Promise<BookingResult>;
}
```

To move to a real database, write one more object satisfying that interface and
change the single export at the bottom of the file:

```ts
export const databaseAdapter: BookingAdapter = {
  id: "database",
  async submit(booking) {
    const row = await db.booking.create({ data: booking });
    await notifyShop(row);
    return { ok: true, whatsappUrl: buildBookingUrl(booking), booking };
  },
};

export const bookingAdapter: BookingAdapter = databaseAdapter;
```

No component, route, or form touches the transport directly, so nothing else
changes. `submit` is only ever called after the booking has passed server-side
validation. Keeping a `whatsappUrl` in the result lets a real backend still hand
the visitor a confirmation message; a backend that sends its own confirmation
can return an empty string and the success panel simply omits the button.

### Validation runs twice

`src/lib/booking.ts` holds one Zod schema. The browser runs it for instant
feedback; `src/app/actions.ts` runs the same schema on the server, and the
server copy is the one that decides. Both the past-date rule and the
passed-slot rule are re-checked there against the server clock, so a tampered
payload or a form left open across midnight is rejected. All date and slot
comparisons resolve in `Asia/Jakarta`, never in the runtime's local zone,
because Vercel runs in UTC and the visitor's phone does not.

The form also carries a honeypot field. It is hidden with `clip-path`, never
with an offscreen `left: -9999px`, because an absolutely positioned element
pushed offscreen without a positioned ancestor escapes the layout and becomes a
horizontal-overflow offender at every breakpoint.

### Attribution

`src/components/ui/WhatsAppLink.tsx` is the only place a `wa.me` link is
rendered anywhere on the site. Every link it builds carries the URL of the page
it was pressed on and the label of the control that was pressed, so an inquiry
arriving on the shop's phone says where it came from. One component owning that
is what stops a new CTA from shipping without attribution: there is no other way
to make a WhatsApp link here.

---

## Cookie consent that gates something real

`src/components/consent/ConsentProvider.tsx`. Nothing here sets a cookie for
show. Each opt-in category switches a real behaviour on and off, and withdrawing
a category deletes what it stored.

| Category | What it does | On withdrawal |
| --- | --- | --- |
| Necessary | Stores the consent answer itself | Cannot be disabled |
| Preferences | The booking form remembers what you typed between visits | Saved draft is deleted |
| Analytics | A short random per-visit reference rides along on the WhatsApp message so the shop can tell repeat inquiries apart | Reference and visit counter are deleted |

The page-of-origin and button label on WhatsApp links are not gated. They are
part of the message the visitor reads before sending it, not tracking.

The banner is reachable again from the Cookie Settings link in the footer and
from the privacy policy page.

---

## Design system

### Colour

Twelve tokens, defined once in `src/app/globals.css` and mirrored as plain
custom properties so they can be parsed by the gate. `npm run check:contrast`
asserts all eighteen text and control pairings; the build refuses to run if any
falls below WCAG AA (4.5:1 for text, 3:1 for control borders). The theme is
dark, which is exactly where contrast usually quietly fails, so the gate runs on
every build rather than on request.

### Layering

One z-index scale, in `:root` in `globals.css`. There are zero raw z-index
values anywhere else in the codebase.

```
content < sticky header < mobile menu < calendar/popover < cookie banner < skip link
```

The two transition layers sit above that stack by necessity: while a curtain is
closed, nothing underneath it is interactive.

Two layering rules are enforced by state rather than by out-stacking anyone,
which is what keeps them true regardless of what the numbers say:

- opening the mobile menu closes any open calendar or listbox, so a popover can
  never be stranded under a full-screen panel;
- the consent banner does not render while the mobile menu is open, and its
  fixed wrapper takes no pointer events so the dead space beside the panel
  cannot swallow a tap meant for the floating booking bar underneath.

### Type

Neue Montreal, converted to WOFF2 and self-hosted from `public/fonts`. Regular,
Medium and Bold. The two faces used above the fold are preloaded.

### Graphics

Every image on the site is generated by `scripts/generate-graphics.mjs` from a
seeded PRNG. No stock photography, no remote placeholder service, no rasterised
art. Re-running the script always produces byte-identical files, and changing a
seed re-rolls the whole family.

Eight motifs, all drawn from barbershop tooling and all sharing one ground, two
hairline greys and a single accent used once per tile: pole, comb, blade, hex
tile, razor, strop, talc, mirror. Nothing depicts a person, a face, or a
haircut, and no alt text names anyone.

The wordmark is drawn geometry rather than typeset text, so it renders
identically in the header, the loader, the app icon and the OG card without
depending on the webfont. `scripts/generate-og.mjs` rasterises the OG card to a
static PNG at build time, which is why it cannot 500 the way a runtime
`next/og` route can when its font file is missing from the serverless bundle.

---

## Motion

### Two loaders

`src/components/transition/Curtain.tsx` renders both.

- **home** is the arrival loader: full ink field, the wordmark drawing itself
  stroke by stroke, grain. It plays on first load and on any navigation whose
  destination is the home page.
- **page** is the travel curtain: a leaner accent-edged panel that sweeps up
  over the page and back down off it, for every other route.

### The transition order

`page closes, content changes, scroll returns to the top, page opens`.

`router.push` is deferred until the curtain is fully closed, and `scroll: false`
hands scroll restoration to us so the jump to the top also happens behind the
curtain. Everything the visitor would otherwise see mid-swap is hidden while it
happens.

### Never trust rAF alone

Every wait in the sequence goes through `afterDuration` in `src/lib/utils.ts`,
which races a `setTimeout` against `requestAnimationFrame`. rAF stops firing in
a backgrounded tab; a sequence that stalls mid-close leaves the curtain shut
forever. The timeout guarantees the sequence completes whether or not the tab is
being painted. The same primitive is used for every focus move, for the same
reason: focus that never lands is focus lost.

### The grain canvas is clipped

`GrainCanvas` always renders inside `.grain-frame`, which sets
`overflow: hidden` and `contain: paint`. A canvas whose backing store is larger
than its CSS box, or which is transformed by a parent, paints outside its own
bounds and ends up as a full-page grey sheet covering the site after the loader
is supposed to be gone.

### Smooth scrolling

Lenis runs on pointer-precise viewports at 1024px and above, and nowhere else.
On phones and tablets it fights the platform's own momentum scrolling, breaks
pull-to-refresh, and makes the calendar feel detached from the finger. It also
stops entirely while the menu, the calendar or a listbox is open.

---

## Accessibility

- Every colour pairing clears WCAG AA, gated on build.
- The per-letter headline reveal announces the whole phrase once from
  `aria-label` on the wrapper; every individual glyph is `aria-hidden`.
- The service picker is a real ARIA 1.2 combobox-with-listbox: Up/Down,
  Home/End, printable-character type-ahead with a one-second buffer, Enter and
  Space to commit, Escape to cancel, Tab to commit and move on, focus never
  leaving the trigger.
- The calendar is a `role="grid"` with a roving tabindex: arrows by day,
  Home/End by week, PageUp/PageDown by month, Escape to close, focus returning
  to the trigger on every exit path. Day cells are 44px on touch.
- Time is a radiogroup of slots, never a free text field.
- The mobile menu traps focus and returns it to the button that opened it.
- Reveal animations default to visible: if the observer never fires, the content
  is still readable.
- `prefers-reduced-motion` collapses the curtains, the cascade, the flap board
  and the comb field.

### Reveal animations and clipped ancestors

`IntersectionObserver` reports a ratio of zero for any element inside an
`overflow: hidden` ancestor, so the callback never fires and the reveal never
runs. Sections here clip on the root only; decorative clipping is applied to
sibling layers instead.

---

## Componentry

Components were taken from [componentry.dev](https://componentry.dev/docs) and
adapted. Where a component fought the direction, it was dropped rather than
forced in.

**Taken and reworked**

| Source | Here | What changed and why |
| --- | --- | --- |
| Letter Cascade | `motion/LetterCascade.tsx` | The original drives every glyph through framer-motion springs. This component renders the hero headline, and therefore the page's LCP element, so the cascade is a CSS keyframe with a per-letter delay instead. Added the `aria-label` plus `aria-hidden` treatment the original leaves to the caller. |
| Magnet Lines | `motion/CombLines.tsx` | The original mounts one `useState` and one `window` mousemove listener per line, so a 9x9 grid attaches 81 listeners and re-renders 81 components per pointer sample. Rewritten to one container listener writing transforms straight to the DOM inside a single rAF. Reads as comb teeth, which is why it is in the hero. |
| Split Flap Display | `motion/FlapBoard.tsx` | The original keeps three pieces of state plus a timeout chain in every cell. Rewritten to one interval for the whole board. Dropped the monospace stack, which would be a costume for "technical" on a page with its own voice. Made the board `aria-hidden` behind a single spoken summary. |

**Dropped, with reasons**

WebGL Liquid, Liquid Chrome, Aurora Flow, Silk Aurora, Prism Gradient, Dither
Prism Hero, Matrix Rain and ASCII Effect all read as neon or sci-fi and fight
the enamel-and-steel world. Eye Tracking renders a human feature, which the
brief rules out. Image Trail, Infinite Image Field and Collection Surfer all
need photography this site deliberately does not have.

---

## Audits

`scripts/overflow-audit.js` reports every element that pokes past the document
edges and is not clipped by an ancestor. Run it on every route at 375, 768 and
1440. Expected result everywhere: zero offenders.

`scripts/contrast-check.mjs` runs automatically before every build.

---

## Copy

Nothing on this site claims anything. No prices, no ratings, no customer counts,
no founding year, no testimonials, no staff names, no promised turnaround times.
The service list describes what each service is, never how good or how fast it
is. The privacy policy and terms describe what the site actually does, with no
invented figures. If the shop later supplies real numbers, they belong in
`src/lib/site.ts` and `src/lib/services.ts`, not scattered through components.
