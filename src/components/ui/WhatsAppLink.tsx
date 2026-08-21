"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { buildInquiryUrl, buildWhatsAppUrl } from "@/lib/whatsapp";
import { useConsent } from "../consent/ConsentProvider";
import { cn } from "@/lib/utils";

type Props = {
  /** Visible button text. Also the tracked origin label unless `trackAs` is set. */
  children: ReactNode;
  /** Overrides the tracked label when the visible text is not descriptive enough. */
  trackAs?: string;
  variant?: "primary" | "ghost" | "quiet";
  size?: "md" | "sm";
  className?: string;
  /** A fully composed message, used by the booking confirmation. */
  message?: string;
  /** A ready-made wa.me URL, used when the server already composed one. */
  url?: string;
};

/** Location is an external store, so read it as one rather than mirroring it in state. */
const subscribeToNothing = () => () => {};

/**
 * The only place a wa.me link is rendered.
 *
 * Every link built here carries the URL of the page it was pressed on and the
 * label of the control that was pressed, so an inquiry arriving on the shop's
 * phone says where it came from. Having one component own that is what stops a
 * new CTA from shipping without attribution: there is no other way to make a
 * WhatsApp link on this site.
 *
 * The origin URL is read from `window.location` on the client so it reflects
 * the real address bar, including anything appended by a campaign link. Before
 * hydration the href is already valid, composed from the canonical origin plus
 * the current path, so a link pressed immediately still works.
 */
export function WhatsAppLink({
  children,
  trackAs,
  variant = "primary",
  size = "md",
  className,
  message,
  url,
}: Props) {
  const pathname = usePathname();
  const { ref } = useConsent();

  const currentUrl = useSyncExternalStore(
    subscribeToNothing,
    useCallback(() => window.location.href, []),
    useCallback(() => `${SITE_URL}${pathname}`, [pathname]),
  );

  const label = trackAs ?? textOf(children);
  const href = url
    ? url
    : message
      ? buildWhatsAppUrl(message)
      : buildInquiryUrl({ sourceUrl: currentUrl, sourceLabel: label, ref });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("btn", `btn--${variant}`, size === "sm" && "btn--sm", className)}
      data-source-label={label}
    >
      {children}
      <WhatsAppGlyph />
    </a>
  );
}

/** Best-effort plain text of a node, for the tracked label. */
function textOf(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ").trim();
  return "Tautan WhatsApp";
}

function WhatsAppGlyph() {
  return (
    <svg
      className="btn__glyph"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.87 9.87 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.19 8.19 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.21.89 2.39 1.01 2.55.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}
