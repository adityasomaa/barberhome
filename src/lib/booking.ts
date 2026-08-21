/**
 * The booking contract, shared verbatim by the client form and the server
 * action. The client copy exists so the visitor gets instant feedback; the
 * server copy is the one that decides. Nothing trusts the browser.
 */
import { z } from "zod";
import { SERVICE_IDS } from "./services";
import {
  allSlots,
  isBeyondHorizon,
  isPastDate,
  isSlotSelectable,
  isValidIsoDate,
} from "./datetime";

/** Field names, used by the form, the server action and the honeypot check. */
export const FIELDS = {
  name: "name",
  phone: "phone",
  service: "service",
  date: "date",
  time: "time",
  notes: "notes",
  /** Honeypot. A real visitor never fills this; a naive bot fills everything. */
  honeypot: "company_website",
} as const;

/**
 * Normalises an Indonesian mobile number to international form without a plus:
 * `0812...` and `+62812...` and `62812...` all become `62812...`.
 */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Nomor WhatsApp wajib diisi.")
  .transform(normalisePhone)
  .refine((v) => /^62\d{8,13}$/.test(v), {
    message: "Gunakan format nomor Indonesia, contoh 0812xxxxxxx.",
  });

export const bookingSchema = z.object({
  [FIELDS.name]: z
    .string()
    .trim()
    .min(2, "Nama wajib diisi, minimal 2 karakter.")
    .max(80, "Nama terlalu panjang, maksimal 80 karakter."),

  [FIELDS.phone]: phoneSchema,

  [FIELDS.service]: z
    .string()
    .trim()
    .refine((v) => SERVICE_IDS.includes(v), { message: "Pilih salah satu layanan." }),

  [FIELDS.date]: z
    .string()
    .trim()
    .refine(isValidIsoDate, { message: "Pilih tanggal terlebih dahulu." })
    // Re-checked on the server so a tampered client cannot post a past date.
    .refine((v) => !isPastDate(v), { message: "Tanggal yang sudah lewat tidak bisa dipilih." })
    .refine((v) => !isBeyondHorizon(v), { message: "Tanggal terlalu jauh ke depan." }),

  [FIELDS.time]: z
    .string()
    .trim()
    .refine((v) => allSlots().includes(v), { message: "Pilih jam terlebih dahulu." }),

  [FIELDS.notes]: z
    .string()
    .trim()
    .max(300, "Catatan terlalu panjang, maksimal 300 karakter.")
    .optional()
    .or(z.literal("")),

  /** The page the request was sent from. Recorded, never shown. */
  sourceUrl: z.string().trim().max(500).optional().or(z.literal("")),
  /** Which button opened the form. Recorded, never shown. */
  sourceLabel: z.string().trim().max(120).optional().or(z.literal("")),
  /** Optional per-visit reference, present only with analytics consent. */
  ref: z.string().trim().max(40).optional().or(z.literal("")),
});

export type BookingInput = z.input<typeof bookingSchema>;
export type Booking = z.output<typeof bookingSchema>;

export type FieldErrors = Partial<Record<string, string>>;

export type BookingResult =
  | { ok: true; whatsappUrl: string; booking: Booking }
  | { ok: false; errors: FieldErrors; formError?: string };

/**
 * Cross-field rule that the per-field schema cannot express: the slot has to
 * still be in the future for the chosen date. Validated on the server so a
 * form left open across midnight cannot submit a slot that has passed.
 */
export function validateSlotAgainstDate(booking: Booking): FieldErrors | null {
  if (!isSlotSelectable(booking.date, booking.time)) {
    return { [FIELDS.time]: "Jam tersebut sudah lewat. Pilih jam lain." };
  }
  return null;
}

export function flattenIssues(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
