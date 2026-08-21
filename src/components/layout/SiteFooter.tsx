"use client";

import { usePathname } from "next/navigation";
import { LEGAL_LINKS, NAV_LINKS, SITE_NAME } from "@/lib/site";
import { TransitionLink } from "../transition/TransitionLink";
import { SectionHeader } from "../ui/SectionHeader";
import { WhatsAppLink } from "../ui/WhatsAppLink";
import { Wordmark } from "../ui/Wordmark";
import { useConsent } from "../consent/ConsentProvider";

/**
 * Every page ends on a call to action.
 *
 * The target swaps depending on where the visitor already is: standing on the
 * booking page, "go and book" is a link to the page you are looking at, so the
 * footer offers the service list instead. On the service list it offers
 * booking. Nowhere does the footer send someone to the page they are on.
 */
export function SiteFooter() {
  const pathname = usePathname();
  const { openSettings } = useConsent();

  const onBooking = pathname === "/reservasi";
  const cta = onBooking
    ? { href: "/layanan", label: "Lihat daftar layanan" }
    : { href: "/reservasi", label: "Buat reservasi" };
  const headline = onBooking
    ? "Belum yakin memilih layanan?"
    : "Siap mengatur jadwal potong Anda?";
  const description = onBooking
    ? "Daftar layanan menjelaskan setiap pengerjaan yang tersedia, supaya pilihan pada formulir lebih mudah ditentukan."
    : "Isi formulir reservasi dengan nama, nomor WhatsApp, layanan, tanggal, dan jam yang Anda inginkan.";

  return (
    <footer className="footer">
      <div className="shell">
        <SectionHeader
          eyebrow="Langkah berikutnya"
          headline={headline}
          description={description}
          align="center"
          cta={
            <div className="footer__cta-row">
              <TransitionLink href={cta.href} className="btn btn--primary">
                {cta.label}
              </TransitionLink>
              <WhatsAppLink variant="ghost" trackAs="Footer - tanya via WhatsApp">
                Tanya lewat WhatsApp
              </WhatsAppLink>
            </div>
          }
        />

        <hr className="rule footer__rule" />

        <div className="footer__grid">
          <div className="footer__brand">
            <Wordmark className="footer__wordmark" />
            <p className="footer__brand-text">
              Barbershop yang menerima reservasi langsung melalui situs ini.
            </p>
          </div>

          <nav className="footer__nav" aria-label="Navigasi footer">
            <h2 className="footer__heading">Halaman</h2>
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <TransitionLink href={link.href} className="footer__link">
                    {link.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer__nav" aria-label="Navigasi ketentuan">
            <h2 className="footer__heading">Ketentuan</h2>
            <ul>
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <TransitionLink href={link.href} className="footer__link">
                    {link.label}
                  </TransitionLink>
                </li>
              ))}
              <li>
                <button type="button" className="footer__link footer__link--button" onClick={openSettings}>
                  Pengaturan Cookie
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <p className="footer__legal">
          {SITE_NAME}. Seluruh isi situs ini disediakan oleh pemilik barbershop.
        </p>
      </div>
    </footer>
  );
}
