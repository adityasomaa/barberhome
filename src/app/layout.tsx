import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";
import { UiStateProvider } from "@/components/ui-state";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { TransitionProvider } from "@/components/transition/TransitionProvider";
import { SmoothScroll } from "@/components/SmoothScroll";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { StickyBookBar } from "@/components/layout/StickyBookBar";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "id_ID",
    url: SITE_URL,
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/graphics/monogram.svg", type: "image/svg+xml" }],
    apple: [{ url: "/graphics/monogram.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0e100f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * The direction contract, emitted into the built markup so it can be audited
 * against the rendered page rather than against intention.
 */
const CONTRACT = `<!--
BARBERHOME - DIRECTION CONTRACT

THESIS: The shop takes its own bookings. The form is the product, not a link
out to somebody else's marketplace. Refuses the category default of a photo
hero over a "Book on <platform>" button.

OWN-WORLD: Enamel and honed steel. Ink ground (#0e100f), bone type (#f2efe9),
one accent (#ff6a3d) used once per surface. Square corners, hairline rules read
as clipper-guard lines, Neue Montreal self-hosted, every image a deterministic
generated SVG from barbershop tooling geometry. Recognisable with all content
removed.

STORY: A visitor understands this is the shop's own booking desk, believes the
request will reach a real person, and leaves having composed a complete
reservation.

FIRST VIEWPORT: Exactly one screen (100svh). Left column carries the section
label, cascading headline, one neutral line, and the primary action. Right
column carries the generated pole tile behind a pointer-reactive comb field.
Primary action sits directly under the headline, above the fold, at every
breakpoint.

FORM: Brief-pinned world (dark, masculine, single accent) and brief-pinned page
structure, so the concept roll was not run: a pinned direction beats the roll.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md
-->`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE_LOCALE}>
      <head>
        {/* The display face carries the hero headline; preloading it keeps the
            largest paint from waiting on a chained request. */}
        <link
          rel="preload"
          href="/fonts/NeueMontreal-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/NeueMontreal-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <div hidden dangerouslySetInnerHTML={{ __html: CONTRACT }} />

        <a href="#konten" className="skip">
          Lewati ke konten utama
        </a>

        <UiStateProvider>
          <ConsentProvider>
            <TransitionProvider>
              <SmoothScroll />
              <SiteHeader />
              <main id="konten" tabIndex={-1}>
                {children}
              </main>
              <SiteFooter />
              <StickyBookBar />
              <ConsentBanner />
            </TransitionProvider>
          </ConsentProvider>
        </UiStateProvider>
      </body>
    </html>
  );
}
