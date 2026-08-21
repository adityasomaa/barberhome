import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BookingForm } from "@/components/booking/BookingForm";

export const metadata: Metadata = {
  title: "Reservasi",
  description:
    "Formulir reservasi Barberhome. Isi nama, nomor WhatsApp, layanan, tanggal, dan jam, lalu kirim sebagai satu pesan WhatsApp ke barbershop.",
  alternates: { canonical: "/reservasi" },
};

export default function BookingPage() {
  return (
    <section className="section section--booking-page" aria-labelledby="reservasi-lead">
      <div className="shell">
        <SectionHeader
          id="reservasi-lead"
          as="h1"
          eyebrow="Reservasi"
          headline="Formulir reservasi Barberhome"
          description="Seluruh isian di bawah ini akan tersusun menjadi satu pesan WhatsApp yang Anda kirim sendiri ke barbershop."
          cta={
            <p className="section-header__cta-note">
              Mulai dari nama Anda pada kolom pertama.
            </p>
          }
        />

        <div className="booking-layout">
          <div className="booking-panel">
            <BookingForm sourceLabel="Halaman reservasi - formulir" />
          </div>

          <aside className="booking-aside" aria-label="Cara kerja reservasi">
            <div className="booking-aside__media" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/graphics/panel-book.svg"
                alt=""
                width={1200}
                height={900}
                loading="lazy"
                decoding="async"
              />
            </div>
            <h2 className="booking-aside__title">Cara kerjanya</h2>
            <ol className="booking-aside__steps">
              <li>Isi seluruh kolom pada formulir.</li>
              <li>Tekan kirim, lalu WhatsApp terbuka dengan pesan yang sudah terisi.</li>
              <li>Kirim pesan tersebut ke barbershop.</li>
              <li>Reservasi tercatat setelah barbershop membalas pesan Anda.</li>
            </ol>
          </aside>
        </div>
      </div>
    </section>
  );
}
