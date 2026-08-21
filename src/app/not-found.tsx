import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="section section--prose" aria-labelledby="notfound-lead">
      <div className="shell">
        <SectionHeader
          id="notfound-lead"
          as="h1"
          eyebrow="Halaman tidak ditemukan"
          headline="Alamat ini tidak tersedia"
          description="Tautan yang Anda buka tidak mengarah ke halaman mana pun di situs ini."
          ctaHref="/"
          ctaLabel="Kembali ke beranda"
        />
      </div>
    </section>
  );
}
