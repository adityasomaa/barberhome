import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TransitionLink } from "@/components/transition/TransitionLink";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan",
  description:
    "Ketentuan penggunaan situs Barberhome dan status permintaan reservasi yang dikirim melalui formulir di situs ini.",
  alternates: { canonical: "/syarat-ketentuan" },
};

export default function TermsPage() {
  return (
    <section className="section section--prose" aria-labelledby="syarat-lead">
      <div className="shell">
        <SectionHeader
          id="syarat-lead"
          as="h1"
          eyebrow="Syarat dan Ketentuan"
          headline="Ketentuan penggunaan situs ini"
          description="Halaman ini menjelaskan dasar penggunaan situs Barberhome dan status permintaan reservasi yang dikirim melalui formulir."
          cta={
            <TransitionLink href="/reservasi" className="btn btn--primary">
              Buka formulir reservasi
            </TransitionLink>
          }
        />

        <div className="prose">
          <h2>Penerimaan ketentuan</h2>
          <p>
            Dengan menggunakan situs ini, Anda menyetujui ketentuan pada halaman ini.
            Bila Anda tidak menyetujuinya, mohon tidak menggunakan formulir reservasi
            yang tersedia.
          </p>

          <h2>Status permintaan reservasi</h2>
          <p>
            Formulir pada situs ini menghasilkan permintaan reservasi, bukan reservasi
            yang telah dipastikan. Permintaan dianggap diterima setelah barbershop
            membalas pesan WhatsApp Anda. Sebelum ada balasan, tidak ada jadwal yang
            terkunci untuk Anda.
          </p>
          <p>
            Barbershop dapat menolak, menggeser, atau meminta penyesuaian atas suatu
            permintaan, misalnya karena jadwal telah terisi. Bila hal itu terjadi,
            pemberitahuan disampaikan melalui percakapan WhatsApp yang sama.
          </p>

          <h2>Ketepatan data yang Anda isikan</h2>
          <p>
            Anda bertanggung jawab atas kebenaran nama dan nomor WhatsApp yang Anda
            isikan. Nomor yang keliru membuat barbershop tidak dapat mengonfirmasi
            permintaan Anda.
          </p>

          <h2>Pembatalan dan perubahan</h2>
          <p>
            Pembatalan atau perubahan jadwal dilakukan melalui percakapan WhatsApp yang
            sama dengan permintaan awal. Formulir pada situs ini tidak menyediakan
            fungsi pembatalan.
          </p>

          <h2>Layanan pihak ketiga</h2>
          <p>
            Pengiriman pesan dilakukan melalui WhatsApp, yang merupakan layanan pihak
            ketiga dengan ketentuannya sendiri. Situs ini tidak mengendalikan
            ketersediaan maupun kinerja layanan tersebut.
          </p>

          <h2>Ketersediaan situs</h2>
          <p>
            Situs ini disediakan sebagaimana adanya. Situs dapat tidak dapat diakses
            untuk sementara karena pemeliharaan atau gangguan teknis di luar kendali
            pemilik situs.
          </p>

          <h2>Hak atas isi situs</h2>
          <p>
            Nama, tanda, teks, dan elemen visual pada situs ini merupakan milik pemilik
            barbershop. Penggunaan ulang di luar keperluan pribadi memerlukan izin
            tertulis dari pemilik.
          </p>

          <h2>Data pribadi</h2>
          <p>
            Penjelasan mengenai data yang diproses situs ini tersedia pada halaman{" "}
            <TransitionLink href="/kebijakan-privasi" className="prose__link">
              Kebijakan Privasi
            </TransitionLink>
            .
          </p>

          <h2>Perubahan ketentuan</h2>
          <p>
            Ketentuan pada halaman ini dapat diperbarui bila cara kerja situs atau
            layanan berubah. Versi yang berlaku adalah versi yang tampil pada halaman
            ini.
          </p>
        </div>
      </div>
    </section>
  );
}
