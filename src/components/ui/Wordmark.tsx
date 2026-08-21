import { cn } from "@/lib/utils";

/**
 * The Barberhome wordmark as drawn geometry.
 *
 * Kept as paths rather than set in the site face so the mark is identical
 * everywhere it appears - header, footer, loader, app icon, OG card - and does
 * not depend on the webfont having loaded.
 */
export function Wordmark({ className, title = "Barberhome" }: { className?: string; title?: string }) {
  return (
    <svg
      className={cn("wordmark", className)}
      viewBox="-8 -8 1026 116"
      role="img"
      aria-label={title}
      fill="none"
      stroke="currentColor"
      strokeWidth="11"
      strokeLinecap="square"
    >
      <path d="M10 0 L10 100 M10 0 L58 0 Q80 0 80 25 Q80 50 58 50 L10 50 M10 50 L62 50 Q84 50 84 75 Q84 100 62 100 L10 100" />
      <path d="M6 100 L32 0 L58 0 L84 100 M20 62 L70 62" transform="translate(102 0)" />
      <path d="M12 0 L12 100 M12 0 L60 0 Q82 0 82 28 Q82 56 60 56 L12 56 M50 56 L84 100" transform="translate(204 0)" />
      <path d="M10 0 L10 100 M10 0 L58 0 Q80 0 80 25 Q80 50 58 50 L10 50 M10 50 L62 50 Q84 50 84 75 Q84 100 62 100 L10 100" transform="translate(306 0)" />
      <path d="M14 0 L14 100 M14 0 L80 0 M14 50 L68 50 M14 100 L80 100" transform="translate(408 0)" />
      <path d="M12 0 L12 100 M12 0 L60 0 Q82 0 82 28 Q82 56 60 56 L12 56 M50 56 L84 100" transform="translate(510 0)" />
      <path d="M12 0 L12 100 M78 0 L78 100 M12 50 L78 50" transform="translate(612 0)" />
      <path d="M45 0 Q84 0 84 50 Q84 100 45 100 Q6 100 6 50 Q6 0 45 0 Z" transform="translate(714 0)" />
      <path d="M8 100 L8 0 L45 66 L82 0 L82 100" transform="translate(816 0)" />
      <path d="M14 0 L14 100 M14 0 L80 0 M14 50 L68 50 M14 100 L80 100" transform="translate(918 0)" />
    </svg>
  );
}
