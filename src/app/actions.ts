"use server";

import {
  FIELDS,
  bookingSchema,
  flattenIssues,
  validateSlotAgainstDate,
  type BookingResult,
} from "@/lib/booking";
import { bookingAdapter } from "@/lib/booking-adapter";

/**
 * The authoritative validation pass.
 *
 * The browser runs the same zod schema for instant feedback, but this is the
 * copy that decides: every field, the past-date rule and the passed-slot rule
 * are all re-checked here against the server clock before anything is
 * composed. A client with JavaScript disabled, a tampered payload, or a form
 * left open across midnight all land here and are rejected the same way.
 */
export async function submitBooking(formData: FormData): Promise<BookingResult> {
  // Honeypot. Rendered clipped, never offscreen-positioned, and labelled for
  // the rare screen reader that reaches it. A filled value means automation.
  if (String(formData.get(FIELDS.honeypot) ?? "").trim() !== "") {
    return { ok: false, errors: {}, formError: "Permintaan tidak dapat diproses." };
  }

  const raw = {
    [FIELDS.name]: String(formData.get(FIELDS.name) ?? ""),
    [FIELDS.phone]: String(formData.get(FIELDS.phone) ?? ""),
    [FIELDS.service]: String(formData.get(FIELDS.service) ?? ""),
    [FIELDS.date]: String(formData.get(FIELDS.date) ?? ""),
    [FIELDS.time]: String(formData.get(FIELDS.time) ?? ""),
    [FIELDS.notes]: String(formData.get(FIELDS.notes) ?? ""),
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    sourceLabel: String(formData.get("sourceLabel") ?? ""),
    ref: String(formData.get("ref") ?? ""),
  };

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: flattenIssues(parsed.error) };
  }

  const slotError = validateSlotAgainstDate(parsed.data);
  if (slotError) {
    return { ok: false, errors: slotError };
  }

  try {
    return await bookingAdapter.submit(parsed.data);
  } catch {
    return {
      ok: false,
      errors: {},
      formError: "Reservasi gagal dikirim. Coba lagi sebentar lagi.",
    };
  }
}
