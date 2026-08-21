"use client";

import { usePathname } from "next/navigation";
import { TransitionLink } from "../transition/TransitionLink";
import { WhatsAppLink } from "../ui/WhatsAppLink";
import { useConsent } from "../consent/ConsentProvider";
import { useUiState } from "../ui-state";

/**
 * A floating booking bar for small screens.
 *
 * It stands down rather than competing for space: hidden while the mobile menu
 * is open, hidden while the consent banner is asking for an answer, and hidden
 * on the booking page itself where it would point at the page you are reading.
 * That is also what keeps the consent banner from swallowing its taps: the two
 * are never on screen at the same time.
 */
export function StickyBookBar() {
  const pathname = usePathname();
  const { consent, ready, settingsOpen } = useConsent();
  const { menuOpen } = useUiState();

  const consentVisible = (ready && consent === null) || settingsOpen;
  if (menuOpen || consentVisible || pathname === "/reservasi") return null;

  return (
    <div className="bookbar">
      <div className="bookbar__inner">
        <TransitionLink href="/reservasi" className="btn btn--primary btn--sm">
          Buat reservasi
        </TransitionLink>
        <WhatsAppLink variant="ghost" size="sm" trackAs="Bar seluler - tanya via WhatsApp">
          Tanya
        </WhatsAppLink>
      </div>
    </div>
  );
}
