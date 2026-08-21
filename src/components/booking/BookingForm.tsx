"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { submitBooking } from "@/app/actions";
import {
  FIELDS,
  bookingSchema,
  flattenIssues,
  type BookingResult,
  type FieldErrors,
} from "@/lib/booking";
import { SERVICES, serviceName } from "@/lib/services";
import { formatLongDate, slotsForDate, todayIso } from "@/lib/datetime";
import { SITE_URL } from "@/lib/site";
import { Listbox } from "../ui/Listbox";
import { DatePicker } from "../ui/DatePicker";
import { TimeSlots } from "../ui/TimeSlots";
import { WhatsAppLink } from "../ui/WhatsAppLink";
import { FlapBoard } from "../motion/FlapBoard";
import { useConsent } from "../consent/ConsentProvider";
import { afterDuration, cn } from "@/lib/utils";

type Draft = { name: string; phone: string; service: string; notes: string };

const EMPTY: Draft = { name: "", phone: "", service: "", notes: "" };

/**
 * The booking form.
 *
 * The point of the whole site: the shop takes its own reservations here rather
 * than sending people to somebody else's platform.
 *
 * Validation runs twice on purpose. The copy in the browser exists so a
 * mistyped number is flagged the moment the field is left; the copy in the
 * server action is the one that decides, and it re-checks every rule including
 * the past-date and passed-slot rules against the server clock. Nothing the
 * browser sends is trusted.
 */
export function BookingForm({
  sourceLabel = "Formulir reservasi",
  compact = false,
}: {
  sourceLabel?: string;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const { consent, readDraft, writeDraft, clearDraft, ref: analyticsRef } = useConsent();
  const formId = useId();

  const [values, setValues] = useState<Draft>(EMPTY);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<BookingResult, { ok: true }> | null>(null);
  const [pending, startTransition] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => todayIso(), []);
  const slots = useMemo(() => (date ? slotsForDate(date) : slotsForDate(today)), [date, today]);

  /* -- Preferences consent, doing something visible ---------------------- */
  // Restoring a saved draft can only happen after hydration, because only the
  // client can read the store, and only with preferences consent granted.
  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues({
        name: draft.name ?? "",
        phone: draft.phone ?? "",
        service: draft.service ?? "",
        notes: draft.notes ?? "",
      });
    }
  }, [readDraft]);

  useEffect(() => {
    if (!consent?.preferences) return;
    const id = window.setTimeout(() => writeDraft({ ...values }), 400);
    return () => window.clearTimeout(id);
  }, [values, consent, writeDraft]);

  const setField = useCallback((key: keyof Draft, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }, []);

  const clearError = useCallback((key: string) => {
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }, []);

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(null);

      const formData = new FormData(event.currentTarget);
      formData.set("sourceUrl", typeof window === "undefined" ? `${SITE_URL}${pathname}` : window.location.href);
      formData.set("sourceLabel", sourceLabel);
      formData.set("ref", analyticsRef ?? "");

      // Client pass: instant feedback, identical rules.
      const parsed = bookingSchema.safeParse({
        [FIELDS.name]: values.name,
        [FIELDS.phone]: values.phone,
        [FIELDS.service]: values.service,
        [FIELDS.date]: date,
        [FIELDS.time]: time,
        [FIELDS.notes]: values.notes,
      });
      if (!parsed.success) {
        const issues = flattenIssues(parsed.error);
        setErrors(issues);
        afterDuration(0, () => errorSummaryRef.current?.focus());
        return;
      }
      setErrors({});

      startTransition(async () => {
        // Server pass: the one that decides.
        const response = await submitBooking(formData);
        if (response.ok) {
          setResult(response);
          clearDraft();
          afterDuration(0, () => successRef.current?.focus());
        } else {
          setErrors(response.errors);
          setFormError(response.formError ?? null);
          afterDuration(0, () => errorSummaryRef.current?.focus());
        }
      });
    },
    [values, date, time, pathname, sourceLabel, analyticsRef, clearDraft],
  );

  const reset = useCallback(() => {
    setResult(null);
    setDate("");
    setTime("");
    setErrors({});
    setFormError(null);
    afterDuration(0, () => formRef.current?.querySelector("input")?.focus());
  }, []);

  const errorList = Object.entries(errors);

  if (result) {
    return (
      <Confirmation
        result={result}
        onReset={reset}
        ref={successRef}
        sourceLabel={sourceLabel}
      />
    );
  }

  return (
    <form
      ref={formRef}
      className={cn("booking", compact && "booking--compact")}
      onSubmit={onSubmit}
      noValidate
    >
      {/* Honeypot. Hidden with clip-path rather than a -9999px offset: an
          absolutely positioned element pushed offscreen without a positioned
          ancestor escapes the layout and becomes a horizontal-overflow
          offender at every breakpoint. */}
      <div className="vh" aria-hidden="true">
        <label htmlFor={`${formId}-hp`}>Jangan isi kolom ini</label>
        <input
          id={`${formId}-hp`}
          type="text"
          name={FIELDS.honeypot}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {errorList.length > 0 || formError ? (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="booking__summary-error"
        >
          <p className="booking__summary-title">Periksa kembali isian berikut</p>
          <ul>
            {formError ? <li>{formError}</li> : null}
            {errorList.map(([key, message]) => (
              <li key={key}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="booking__grid">
        <TextField
          id={`${formId}-name`}
          name={FIELDS.name}
          label="Nama"
          autoComplete="name"
          value={values.name}
          onChange={(v) => setField("name", v)}
          error={errors[FIELDS.name]}
          placeholder="Nama yang dipakai saat datang"
        />

        <TextField
          id={`${formId}-phone`}
          name={FIELDS.phone}
          label="Nomor WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={(v) => setField("phone", v)}
          error={errors[FIELDS.phone]}
          placeholder="08xxxxxxxxxx"
          hint="Dipakai untuk mengonfirmasi reservasi Anda."
        />

        <div className="booking__cell booking__cell--full">
          <Listbox
            id={`${formId}-service`}
            name={FIELDS.service}
            label="Layanan"
            placeholder="Pilih layanan"
            options={SERVICES.map((s) => ({ value: s.id, label: s.name }))}
            value={values.service}
            onChange={(v) => setField("service", v)}
            invalid={Boolean(errors[FIELDS.service])}
            describedBy={errors[FIELDS.service] ? `${formId}-service-error` : undefined}
          />
          <FieldError id={`${formId}-service-error`} message={errors[FIELDS.service]} />
        </div>

        <div className="booking__cell booking__cell--full">
          <DatePicker
            id={`${formId}-date`}
            name={FIELDS.date}
            label="Tanggal"
            value={date}
            onChange={(iso) => {
              setDate(iso);
              clearError(FIELDS.date);
            }}
            invalid={Boolean(errors[FIELDS.date])}
            describedBy={errors[FIELDS.date] ? `${formId}-date-error` : undefined}
          />
          <FieldError id={`${formId}-date-error`} message={errors[FIELDS.date]} />
        </div>

        <div className="booking__cell booking__cell--full">
          <TimeSlots
            name={FIELDS.time}
            label="Jam"
            slots={slots}
            value={time}
            onChange={(v) => {
              setTime(v);
              clearError(FIELDS.time);
            }}
            invalid={Boolean(errors[FIELDS.time])}
            describedBy={errors[FIELDS.time] ? `${formId}-time-error` : undefined}
          />
          <FieldError id={`${formId}-time-error`} message={errors[FIELDS.time]} />
        </div>

        <div className="booking__cell booking__cell--full">
          <label className="field__label" htmlFor={`${formId}-notes`}>
            Catatan
            <span className="field__optional"> (opsional)</span>
          </label>
          <textarea
            id={`${formId}-notes`}
            name={FIELDS.notes}
            rows={3}
            maxLength={300}
            className={cn("control", "control--area", errors[FIELDS.notes] && "control--invalid")}
            value={values.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="Hal lain yang perlu diketahui sebelum Anda datang"
            aria-describedby={errors[FIELDS.notes] ? `${formId}-notes-error` : undefined}
          />
          <FieldError id={`${formId}-notes-error`} message={errors[FIELDS.notes]} />
        </div>
      </div>

      <div className="booking__foot">
        <button type="submit" className="btn btn--primary btn--wide" disabled={pending}>
          {pending ? "Menyiapkan pesan" : "Kirim reservasi"}
        </button>
        <p className="booking__note">
          Setelah dikirim, Anda akan mendapat pesan WhatsApp berisi seluruh isian di
          atas untuk dikirim ke barbershop.
        </p>
      </div>

      <noscript>
        <p className="booking__note">
          Formulir ini memerlukan JavaScript untuk memilih tanggal dan jam. Anda tetap
          bisa menghubungi barbershop lewat WhatsApp dari tautan di bagian bawah halaman.
        </p>
      </noscript>
    </form>
  );
}

/* -- Confirmation ---------------------------------------------------------- */

function Confirmation({
  result,
  onReset,
  ref,
  sourceLabel,
}: {
  result: Extract<BookingResult, { ok: true }>;
  onReset: () => void;
  ref: React.Ref<HTMLDivElement>;
  sourceLabel: string;
}) {
  const { booking, whatsappUrl } = result;
  const rows = [
    { label: "Nama", value: booking.name },
    { label: "Layanan", value: serviceName(booking.service) },
    { label: "Waktu", value: `${formatLongDate(booking.date)} ${booking.time}` },
  ];
  const summary = `Reservasi tersusun untuk ${booking.name}, layanan ${serviceName(
    booking.service,
  )}, pada ${formatLongDate(booking.date)} pukul ${booking.time} WIB.`;

  return (
    <div ref={ref} tabIndex={-1} className="booking booking--done" role="status">
      <p className="section-header__eyebrow">Langkah terakhir</p>
      <h3 className="booking__done-title">Reservasi Anda sudah tersusun</h3>
      <p className="booking__done-text">
        Tekan tombol di bawah untuk membuka WhatsApp dengan pesan yang sudah terisi.
        Reservasi tercatat setelah barbershop membalas pesan tersebut.
      </p>

      <FlapBoard rows={rows} summary={summary} />

      <div className="booking__done-actions">
        <WhatsAppLink url={whatsappUrl} trackAs={`${sourceLabel} - konfirmasi`}>
          Buka WhatsApp
        </WhatsAppLink>
        <button type="button" className="btn btn--quiet" onClick={onReset}>
          Ubah isian
        </button>
      </div>
    </div>
  );
}

/* -- Field primitives ------------------------------------------------------ */

function TextField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  hint,
  ...rest
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id" | "name">) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="booking__cell">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("control", error && "control--invalid")}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        {...rest}
      />
      {hint ? (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      ) : null}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="field__error">
      {message}
    </p>
  );
}
