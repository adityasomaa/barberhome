import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CookieSettingsButton } from "@/components/consent/CookieSettingsButton";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Penjelasan data yang diproses situs Barberhome, penyimpanan di perangkat, dan cara mengubah pilihan cookie.",
  alternates: { canonical: "/kebijakan-privasi" },
};

export default function PrivacyPage() {
  return (
    <section className="section section--prose" aria-labelledby="privasi-lead">
      <div className="shell">
        <SectionHeader
          id="privasi-lead"
          as="h1"
          eyebrow="Kebijakan Privasi"
          headline="Data apa yang diproses situs ini"
          description="Halaman ini menjelaskan data yang diproses saat Anda menggunakan situs Barberhome dan pilihan yang Anda miliki atasnya."
          cta={<CookieSettingsButton />}
        />

        <div className="prose">
          <h2>Data yang Anda isikan pada formulir reservasi</h2>
          <p>
            Formulir reservasi meminta nama, nomor WhatsApp, layanan, tanggal, jam, dan
            catatan opsional. Isian tersebut dikirim ke server situs ini hanya untuk
            diperiksa keabsahannya, lalu disusun menjadi teks pesan WhatsApp. Situs ini
            tidak menyimpan isian tersebut ke dalam basis data.
          </p>
          <p>
            Pesan hasil penyusunan tidak terkirim dengan sendirinya. Pengiriman
            dilakukan oleh Anda melalui aplikasi WhatsApp. Setelah pesan terkirim, isi
            pesan berada pada WhatsApp dan pada perangkat barbershop, dan tunduk pada
            ketentuan privasi WhatsApp.
          </p>

          <h2>Penyimpanan di perangkat Anda</h2>
          <p>
            Situs ini menyimpan data pada perangkat Anda hanya sesuai kategori yang Anda
            izinkan. Kategorinya sebagai berikut.
          </p>
          <h3>Diperlukan</h3>
          <p>
            Menyimpan pilihan cookie Anda beserta waktu pilihan itu dibuat. Tanpa
            penyimpanan ini, pilihan Anda akan ditanyakan ulang pada setiap kunjungan.
            Kategori ini tidak dapat dimatikan.
          </p>
          <h3>Preferensi</h3>
          <p>
            Menyimpan isian formulir reservasi pada perangkat Anda, sehingga tidak perlu
            diketik ulang jika Anda kembali. Data ini tidak dikirim ke mana pun. Jika
            kategori ini dimatikan, data yang tersimpan akan dihapus.
          </p>
          <h3>Analitik</h3>
          <p>
            Membuat kode acak singkat untuk kunjungan Anda dan menambahkannya pada pesan
            WhatsApp yang Anda kirim, sehingga barbershop dapat membedakan pesan yang
            berasal dari kunjungan berbeda. Kode tersebut tidak berisi identitas Anda.
            Jika kategori ini dimatikan, kode tersebut dihapus dan tidak dibuat lagi.
          </p>

          <h2>Informasi asal tautan</h2>
          <p>
            Setiap tombol WhatsApp pada situs ini menambahkan alamat halaman tempat
            tombol ditekan dan nama tombol tersebut ke dalam isi pesan. Informasi itu
            merupakan bagian dari pesan yang Anda baca sebelum mengirim, dan berguna
            bagi barbershop untuk mengetahui konteks pertanyaan Anda.
          </p>

          <h2>Penyedia layanan</h2>
          <p>
            Situs ini dijalankan pada penyedia hosting pihak ketiga. Seperti umumnya
            layanan hosting, penyedia tersebut memproses catatan teknis permintaan
            seperti alamat IP dan jenis peramban untuk keperluan operasional dan
            keamanan.
          </p>

          <h2>Hak Anda</h2>
          <p>
            Anda dapat mengubah atau menarik persetujuan penyimpanan kapan saja melalui
            tautan Pengaturan Cookie yang tersedia pada bagian bawah setiap halaman.
            Menghapus data situs melalui pengaturan peramban Anda juga akan menghapus
            seluruh penyimpanan yang dibuat situs ini.
          </p>
          <p>
            Untuk pertanyaan mengenai data yang telah Anda kirim melalui WhatsApp,
            silakan hubungi barbershop melalui percakapan WhatsApp yang sama.
          </p>

          <h2>Perubahan halaman ini</h2>
          <p>
            Isi halaman ini dapat diperbarui bila cara kerja situs berubah. Versi yang
            berlaku adalah versi yang tampil pada halaman ini.
          </p>
        </div>
      </div>
    </section>
  );
}
