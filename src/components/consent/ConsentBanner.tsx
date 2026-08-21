"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useConsent } from "./ConsentProvider";
import { useUiState } from "../ui-state";
import { TransitionLink } from "../transition/TransitionLink";

/**
 * Consent banner.
 *
 * Two layering rules are handled by state rather than by out-stacking anyone:
 *   - it does not render at all while the mobile menu is open, so it can never
 *     sit on top of the menu;
 *   - the fixed wrapper is `pointer-events: none` and only the panel itself
 *     takes pointer events, so the dead space beside the panel never eats a
 *     tap meant for the floating booking bar underneath it.
 */
export function ConsentBanner() {
  const {
    consent,
    ready,
    settingsOpen,
    openSettings,
    closeSettings,
    save,
    acceptAll,
    rejectAll,
  } = useConsent();
  const { menuOpen } = useUiState();
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  const [preferences, setPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  const undecided = ready && consent === null;
  const visible = (undecided || settingsOpen) && !menuOpen;

  // The toggles are working copies: opening the panel seeds them from the
  // stored answer, and nothing is written back until "Simpan pilihan".
  useEffect(() => {
    if (!settingsOpen) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setPreferences(consent?.preferences ?? false);
    setAnalytics(consent?.analytics ?? false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [settingsOpen, consent]);

  useEffect(() => {
    if (!visible) return;
    document.documentElement.dataset.consentBanner = "open";
    return () => {
      delete document.documentElement.dataset.consentBanner;
    };
  }, [visible]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSettings();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, closeSettings]);

  if (!visible) return null;

  const showControls = settingsOpen;

  return (
    <div className="consent" role="region" aria-labelledby={headingId}>
      <div className="consent__panel" ref={panelRef}>
        <div className="consent__body">
          <h2 id={headingId} className="consent__title">
            Cookie dan penyimpanan di perangkat
          </h2>
          <p className="consent__text">
            Situs ini menyimpan data di perangkat Anda hanya jika Anda mengizinkannya.
            Pilihan Anda tersimpan dan bisa diubah kapan saja lewat tautan Pengaturan
            Cookie di bagian bawah halaman. Rinciannya ada di{" "}
            <TransitionLink href="/kebijakan-privasi" className="consent__link">
              Kebijakan Privasi
            </TransitionLink>
            .
          </p>

          {showControls ? (
            <fieldset className="consent__options">
              <legend className="vh">Kategori penyimpanan</legend>

              <Option
                title="Diperlukan"
                description="Menyimpan pilihan cookie Anda. Tidak bisa dimatikan karena tanpa ini pilihan Anda akan ditanyakan ulang setiap kali."
                checked
                disabled
                onChange={() => {}}
              />
              <Option
                title="Preferensi"
                description="Mengingat isian formulir reservasi di perangkat ini supaya tidak perlu diketik ulang."
                checked={preferences}
                onChange={setPreferences}
              />
              <Option
                title="Analitik"
                description="Menambahkan kode acak singkat pada pesan WhatsApp yang Anda kirim, supaya barbershop bisa membedakan pesan dari kunjungan yang berbeda."
                checked={analytics}
                onChange={setAnalytics}
              />
            </fieldset>
          ) : null}
        </div>

        <div className="consent__actions">
          {showControls ? (
            <>
              <button type="button" className="btn btn--primary" onClick={() => save({ preferences, analytics })}>
                Simpan pilihan
              </button>
              <button type="button" className="btn btn--ghost" onClick={acceptAll}>
                Izinkan semua
              </button>
              <button type="button" className="btn btn--quiet" onClick={rejectAll}>
                Tolak semua
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn--primary" onClick={acceptAll}>
                Izinkan semua
              </button>
              <button type="button" className="btn btn--ghost" onClick={rejectAll}>
                Tolak semua
              </button>
              <button type="button" className="btn btn--quiet" onClick={openSettings}>
                Atur
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Option({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="consent__option">
      <label className="consent__switch" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="consent__track" aria-hidden="true">
          <span className="consent__thumb" />
        </span>
        <span className="consent__option-title">{title}</span>
      </label>
      <p className="consent__option-text">{description}</p>
    </div>
  );
}
