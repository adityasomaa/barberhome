import type { Metadata } from "next";
import { Hero } from "@/components/layout/Hero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { BookingForm } from "@/components/booking/BookingForm";
import { SERVICES } from "@/lib/services";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description: SITE_DESCRIPTION,
};

/**
 * Home is three things and nothing else: the hero, a short service list, and
 * the booking form. No story section, no manifesto. The form is the reason the
 * site exists, so it appears on the first page rather than only behind a link.
 */
export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="section section--services-brief" aria-labelledby="layanan-title">
        <div className="shell">
          <SectionHeader
            id="layanan-title"
            eyebrow="Layanan"
            headline="Pengerjaan yang tersedia"
            description="Daftar ringkas layanan yang bisa dipilih pada formulir reservasi."
            ctaHref="/layanan"
            ctaLabel="Lihat rincian layanan"
          />

          <ol className="brieflist">
            {SERVICES.map((service, index) => (
              <Reveal as="li" key={service.id} className="brieflist__item" delay={index * 60}>
                <span className="brieflist__name">{service.name}</span>
                <span className="brieflist__text">{service.description}</span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--booking" aria-labelledby="reservasi-title" id="reservasi">
        <div className="shell">
          <SectionHeader
            id="reservasi-title"
            eyebrow="Reservasi"
            headline="Kirim permintaan jadwal Anda"
            description="Isi nama, nomor WhatsApp, layanan, tanggal, dan jam. Seluruh isian akan tersusun menjadi satu pesan WhatsApp."
            cta={
              <p className="section-header__cta-note">
                Formulirnya ada tepat di bawah ini.
              </p>
            }
          />

          <div className="booking-panel">
            <BookingForm sourceLabel="Beranda - formulir reservasi" />
          </div>
        </div>
      </section>
    </>
  );
}
