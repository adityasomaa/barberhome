/**
 * Calendar helpers.
 *
 * All comparisons resolve in BOOKING.timeZone, never in the runtime's local
 * zone. The server runs in UTC on Vercel and the visitor's phone does not, so
 * "is this date in the past" has to be answered against one agreed clock or
 * the client and the server disagree at the edges of the day.
 */
import { BOOKING } from "./site";

/** ISO calendar day, `YYYY-MM-DD`. */
export type IsoDate = string;

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BOOKING.timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: BOOKING.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Today, as an ISO day string in the booking timezone. */
export function todayIso(now: Date = new Date()): IsoDate {
  return dayFormatter.format(now);
}

/** Current wall-clock time in the booking timezone, as `HH:mm`. */
export function nowTime(now: Date = new Date()): string {
  return timeFormatter.format(now);
}

export function isValidIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const probe = new Date(Date.UTC(y, m - 1, d));
  return (
    probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === m - 1 &&
    probe.getUTCDate() === d
  );
}

/** Parses `YYYY-MM-DD` into a UTC-midnight Date, purely for calendar maths. */
export function parseIso(iso: IsoDate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIso(date: Date): IsoDate {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const d = parseIso(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

/** The last date the calendar will accept. */
export function maxSelectableIso(now: Date = new Date()): IsoDate {
  return addDays(todayIso(now), BOOKING.horizonDays);
}

/** Every slot the shop can be booked into, independent of date. */
export function allSlots(): string[] {
  const slots: string[] = [];
  const step = BOOKING.slotMinutes;
  for (let minutes = BOOKING.openHour * 60; minutes < BOOKING.closeHour * 60; minutes += step) {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

/**
 * Slots still selectable for a given date. Today loses every slot that has
 * already passed; other dates keep the full list.
 */
export function slotsForDate(iso: IsoDate, now: Date = new Date()): string[] {
  const slots = allSlots();
  if (iso !== todayIso(now)) return slots;
  const current = nowTime(now);
  return slots.filter((s) => s > current);
}

export function isSlotSelectable(iso: IsoDate, time: string, now: Date = new Date()): boolean {
  return slotsForDate(iso, now).includes(time);
}

export function isPastDate(iso: IsoDate, now: Date = new Date()): boolean {
  return iso < todayIso(now);
}

export function isBeyondHorizon(iso: IsoDate, now: Date = new Date()): boolean {
  return iso > maxSelectableIso(now);
}

export const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Monday-first, matching Indonesian calendar convention. */
export const WEEKDAYS_ID_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
export const WEEKDAYS_ID_LONG = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

/** "Senin, 3 Maret 2026" */
export function formatLongDate(iso: IsoDate): string {
  const d = parseIso(iso);
  const weekday = WEEKDAYS_ID_LONG[(d.getUTCDay() + 6) % 7];
  return `${weekday}, ${d.getUTCDate()} ${MONTHS_ID[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "3 Mar 2026", for tight spaces. */
export function formatShortDate(iso: IsoDate): string {
  const d = parseIso(iso);
  return `${d.getUTCDate()} ${MONTHS_ID[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`;
}

export type CalendarCell = { iso: IsoDate; day: number; inMonth: boolean };

/**
 * A 6-row Monday-first grid for the given month, padded with the neighbouring
 * months so the grid never reflows between months.
 */
export function monthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(Date.UTC(year, month, 1));
  const leading = (first.getUTCDay() + 6) % 7;
  const cells: CalendarCell[] = [];
  const start = new Date(first);
  start.setUTCDate(start.getUTCDate() - leading);
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    cells.push({
      iso: toIso(d),
      day: d.getUTCDate(),
      inMonth: d.getUTCMonth() === month && d.getUTCFullYear() === year,
    });
  }
  return cells;
}
