/**
 * The service catalogue.
 *
 * No prices: the shop has not supplied them, and inventing them would put a
 * commercial claim on the page that nobody made. Descriptions state what the
 * service is, never how good, how fast, or how popular it is.
 */

export type Service = {
  /** Stable id. This is what the form submits and what server validation checks. */
  id: string;
  name: string;
  description: string;
  /** Generated tile in public/graphics. */
  graphic: string;
  /** Alt text. Describes the pattern, never a person or a haircut. */
  graphicAlt: string;
};

export const SERVICES: Service[] = [
  {
    id: "potong-rambut",
    name: "Potong Rambut",
    description:
      "Pemotongan rambut dengan bentuk yang ditentukan bersama sebelum pengerjaan dimulai.",
    graphic: "/graphics/service-potong-rambut.svg",
    graphicAlt: "Pola garis vertikal bergaris menyerupai gigi sisir",
  },
  {
    id: "cukur-jenggot",
    name: "Cukur Jenggot dan Kumis",
    description:
      "Perapian garis jenggot, kumis, dan area sekitarnya menggunakan pisau cukur.",
    graphic: "/graphics/service-cukur-jenggot.svg",
    graphicAlt: "Pola busur konsentris yang menyapu dari salah satu sudut",
  },
  {
    id: "keramas-pijat",
    name: "Keramas dan Pijat Kepala",
    description:
      "Pencucian rambut disertai pijatan pada area kepala, leher, dan bahu.",
    graphic: "/graphics/service-keramas-pijat.svg",
    graphicAlt: "Bidang titik-titik halus dengan kerapatan bergradasi",
  },
  {
    id: "potong-anak",
    name: "Potong Rambut Anak",
    description:
      "Layanan potong rambut untuk anak, dengan pendampingan orang tua di tempat.",
    graphic: "/graphics/service-potong-anak.svg",
    graphicAlt: "Pola ubin mozaik heksagonal",
  },
  {
    id: "pewarnaan",
    name: "Pewarnaan Rambut",
    description:
      "Pewarnaan rambut dengan pilihan warna yang dibicarakan sebelum pengerjaan.",
    graphic: "/graphics/service-pewarnaan.svg",
    graphicAlt: "Pola anyaman garis silang yang rapat",
  },
  {
    id: "perawatan",
    name: "Perawatan Rambut",
    description:
      "Perawatan rambut dan kulit kepala, termasuk penataan setelah pengerjaan.",
    graphic: "/graphics/service-perawatan.svg",
    graphicAlt: "Pola rusuk chevron yang bertumpuk",
  },
];

export const SERVICE_IDS = SERVICES.map((s) => s.id);

export function getService(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

export function serviceName(id: string): string {
  return getService(id)?.name ?? id;
}
