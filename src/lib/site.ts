/**
 * Single source of truth for site-level configuration.
 *
 * Deliberately claim-free: no prices, no ratings, no counts, no founding year,
 * no promised turnaround times, no staff names. Anything factual that the shop
 * has not confirmed lives here as a clearly-marked placeholder rather than as
 * invented copy inside a component.
 */

/**
 * Final production origin. Canonical URLs, the sitemap, robots and the OG card
 * all derive from this one constant.
 *
 * Not `barberhome.vercel.app`: that hostname is already assigned to another
 * Vercel account and returns 409 on claim. `barberhome-id.vercel.app` is the
 * nearest free name and was claimed explicitly, rather than accepting the
 * team-scoped default `barberhome-onyx-creative-asia.vercel.app`.
 */
export const SITE_URL = "https://barberhome-id.vercel.app";

export const SITE_NAME = "Barberhome";

/** Used as the browser title suffix and the OG site name. */
export const SITE_TAGLINE = "Barbershop dan Reservasi Online";

export const SITE_DESCRIPTION =
  "Website resmi Barberhome. Lihat daftar layanan dan kirim permintaan reservasi langsung ke barbershop lewat formulir di situs ini.";

export const SITE_LOCALE = "id-ID";

/**
 * PLACEHOLDER. Replace with the shop's real WhatsApp number in international
 * format without a leading + (for example 628123456789), via the
 * NEXT_PUBLIC_WHATSAPP_NUMBER environment variable. Until it is replaced, the
 * composed wa.me links are structurally correct but point at a dummy number.
 */
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "6281234567890";

export const WHATSAPP_NUMBER_IS_PLACEHOLDER =
  !process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

/** The three pages in the primary navigation. */
export const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/layanan", label: "Layanan" },
  { href: "/reservasi", label: "Reservasi" },
] as const;

export const LEGAL_LINKS = [
  { href: "/kebijakan-privasi", label: "Kebijakan Privasi" },
  { href: "/syarat-ketentuan", label: "Syarat dan Ketentuan" },
] as const;

/**
 * Booking window configuration. These are operational settings, not marketing
 * claims, and are never rendered as an "we are open from X to Y" statement.
 */
export const BOOKING = {
  /** IANA zone every date and slot comparison is resolved in. */
  timeZone: "Asia/Jakarta",
  /** First selectable slot, 24h. */
  openHour: 10,
  /** Last selectable slot starts before this hour, 24h. */
  closeHour: 21,
  /** Minutes between slots. */
  slotMinutes: 30,
  /** How far ahead the calendar allows selection, in days. */
  horizonDays: 60,
} as const;
