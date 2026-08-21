/**
 * Every wa.me link on the site is composed here, so the message format is
 * identical whether it came from a nav button, a section CTA, or a completed
 * booking form, and so origin tracking can never be forgotten at a call site.
 */
import { SITE_URL, WHATSAPP_NUMBER } from "./site";
import { formatLongDate } from "./datetime";
import { serviceName } from "./services";
import type { Booking } from "./booking";

/** Where this inquiry came from. Appended to every message. */
export type Origin = {
  /** Absolute URL of the page the visitor was on. */
  sourceUrl: string;
  /** Human label of the control they pressed. */
  sourceLabel: string;
  /** Optional per-visit reference. Present only with analytics consent. */
  ref?: string;
};

function originLines(origin: Origin): string[] {
  const lines = ["", "---", `Dikirim dari: ${origin.sourceUrl}`, `Tombol: ${origin.sourceLabel}`];
  if (origin.ref) lines.push(`Ref: ${origin.ref}`);
  return lines;
}

export function buildWhatsAppUrl(message: string, number: string = WHATSAPP_NUMBER): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** A plain inquiry, used by every WhatsAppLink that is not the booking form. */
export function composeInquiryMessage(origin: Origin): string {
  return ["Halo Barberhome, saya ingin bertanya.", ...originLines(origin)].join("\n");
}

/**
 * The full booking request. Contains every value the visitor entered, so the
 * shop can read the whole request without a follow-up round trip.
 */
export function composeBookingMessage(booking: Booking): string {
  const lines = [
    "Halo Barberhome, saya ingin membuat reservasi.",
    "",
    `Nama: ${booking.name}`,
    `Nomor WhatsApp: +${booking.phone}`,
    `Layanan: ${serviceName(booking.service)}`,
    `Tanggal: ${formatLongDate(booking.date)}`,
    `Jam: ${booking.time} WIB`,
  ];
  if (booking.notes) lines.push(`Catatan: ${booking.notes}`);
  lines.push(
    ...originLines({
      sourceUrl: booking.sourceUrl || SITE_URL,
      sourceLabel: booking.sourceLabel || "Formulir reservasi",
      ref: booking.ref || undefined,
    }),
  );
  return lines.join("\n");
}

export function buildInquiryUrl(origin: Origin): string {
  return buildWhatsAppUrl(composeInquiryMessage(origin));
}

export function buildBookingUrl(booking: Booking): string {
  return buildWhatsAppUrl(composeBookingMessage(booking));
}
