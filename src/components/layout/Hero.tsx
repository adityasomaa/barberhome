import { LetterCascade } from "../motion/LetterCascade";
import { CombLines } from "../motion/CombLines";
import { TransitionLink } from "../transition/TransitionLink";
import { WhatsAppLink } from "../ui/WhatsAppLink";

/**
 * The first viewport, and exactly one viewport.
 *
 * Height is `100svh`, not `100vh` and not `100dvh`. On a phone, `100vh` is the
 * tall-address-bar height and overflows on arrival; `100dvh` is correct at any
 * instant but *changes* as the browser chrome hides during a scroll, which
 * resizes the hero out from under the reader. `svh` is the small viewport
 * height: the hero is sized for the chrome-visible case once and never resizes
 * again.
 *
 * The background tile is fixed in place. It has no scroll-linked transform of
 * any kind, so nothing about it zooms, drifts or parallaxes as the page moves;
 * the only motion in this section is the comb field responding to the pointer.
 */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__backdrop" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/graphics/hero.svg"
          alt=""
          className="hero__image"
          width={1600}
          height={1000}
          fetchPriority="high"
          decoding="async"
        />
        <CombLines className="hero__comb" rows={6} columns={10} />
      </div>

      <div className="hero__inner shell">
        <div className="hero__content">
          <p className="section-header__eyebrow">Barberhome</p>

          <h1 id="hero-title" className="hero__headline">
            <LetterCascade text="Atur jadwal potong" delay={120} />
            <span className="hero__headline-accent">
              <LetterCascade text="langsung di sini" delay={520} />
            </span>
          </h1>

          <p className="hero__description">
            Barbershop dengan formulir reservasi sendiri. Pilih layanan, tanggal, dan
            jam, lalu kirim ke WhatsApp barbershop.
          </p>

          <div className="hero__actions">
            <TransitionLink href="/reservasi" className="btn btn--primary">
              Buat reservasi
            </TransitionLink>
            <WhatsAppLink variant="ghost" trackAs="Hero - tanya via WhatsApp">
              Tanya lewat WhatsApp
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </section>
  );
}
