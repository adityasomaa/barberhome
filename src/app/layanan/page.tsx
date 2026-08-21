import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { SERVICES } from "@/lib/services";

export const metadata: Metadata = {
  title: "Layanan",
  description:
    "Daftar layanan Barberhome beserta penjelasan singkat setiap pengerjaan, dan tautan langsung ke formulir reservasi.",
  alternates: { canonical: "/layanan" },
};

export default function ServicesPage() {
  return (
    <>
      <section className="section section--lead" aria-labelledby="layanan-lead">
        <div className="shell">
          <SectionHeader
            id="layanan-lead"
            as="h1"
            eyebrow="Layanan"
            headline="Setiap pengerjaan yang tersedia"
            description="Penjelasan singkat tiap layanan, supaya pilihan pada formulir reservasi lebih mudah ditentukan."
            ctaHref="/reservasi"
            ctaLabel="Buat reservasi"
          />
        </div>
      </section>

      <section className="section section--grid" aria-label="Daftar layanan">
        <div className="shell">
          <ul className="tiles">
            {SERVICES.map((service, index) => (
              <Reveal as="li" key={service.id} className="tile" delay={(index % 3) * 80}>
                <div className="tile__media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={service.graphic}
                    alt={service.graphicAlt}
                    width={900}
                    height={675}
                    loading={index < 2 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </div>
                <div className="tile__body">
                  <h2 className="tile__title">{service.name}</h2>
                  <p className="tile__text">{service.description}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
