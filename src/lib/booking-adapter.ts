/**
 * Booking transport, behind one interface.
 *
 * The shop has no booking backend yet, so the shipped adapter validates the
 * request on the server and hands back a prefilled WhatsApp message. Swapping
 * in a real database means writing one more object that satisfies
 * `BookingAdapter` and changing the single export at the bottom of this file.
 * No component, route, or form touches the transport directly.
 */
import type { Booking, BookingResult } from "./booking";
import { buildBookingUrl } from "./whatsapp";

export interface BookingAdapter {
  /** Stable id, useful for logging which transport handled a request. */
  readonly id: string;
  /**
   * Called only after the booking has passed server-side validation.
   * Anything thrown here surfaces to the visitor as a form-level error.
   */
  submit(booking: Booking): Promise<BookingResult>;
}

/**
 * Shipped adapter. Persists nothing; the message itself is the record.
 */
export const whatsappAdapter: BookingAdapter = {
  id: "whatsapp",
  async submit(booking) {
    return { ok: true, whatsappUrl: buildBookingUrl(booking), booking };
  },
};

/*
 * Example of the replacement, for whoever picks this up next:
 *
 *   export const databaseAdapter: BookingAdapter = {
 *     id: "database",
 *     async submit(booking) {
 *       const row = await db.booking.create({ data: booking });
 *       await notifyShop(row);
 *       return { ok: true, whatsappUrl: buildBookingUrl(booking), booking };
 *     },
 *   };
 *
 * Point `bookingAdapter` at it and every call site keeps working. Keeping the
 * WhatsApp URL in the result lets a real backend still offer the visitor a
 * confirmation message; a backend that sends its own confirmation can return
 * an empty string and the success panel will simply omit the button.
 */

export const bookingAdapter: BookingAdapter = whatsappAdapter;
