"use client";

import { useConsent } from "./ConsentProvider";

/** Reopens the consent panel from inside page content. */
export function CookieSettingsButton({ label = "Ubah pengaturan cookie" }: { label?: string }) {
  const { openSettings } = useConsent();
  return (
    <button type="button" className="btn btn--ghost" onClick={openSettings}>
      {label}
    </button>
  );
}
