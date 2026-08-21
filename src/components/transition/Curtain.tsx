"use client";

import { GrainCanvas } from "./GrainCanvas";

export type CurtainVariant = "home" | "page";
export type CurtainState = "closed" | "closing" | "opening" | "hidden";

/**
 * Two curtains, one component.
 *
 *  - `home` is the arrival loader: the full ink field, the wordmark drawing
 *    itself stroke by stroke, grain. It plays on first load and on any
 *    navigation whose destination is the home page.
 *  - `page` is the travel curtain: a leaner accent-edged panel that sweeps up
 *    over the page and back down off it. It plays for every other route.
 *
 * The element is `inert` in every state so a closed curtain can never take
 * focus or swallow a click meant for the page behind it.
 */
export function Curtain({
  variant,
  state,
  label,
}: {
  variant: CurtainVariant;
  state: CurtainState;
  label: string;
}) {
  if (state === "hidden") return null;

  return (
    <div
      className="curtain"
      data-variant={variant}
      data-state={state}
      role="presentation"
      aria-hidden="true"
      inert
    >
      <div className="curtain__panel">
        <div className="grain-frame">
          <GrainCanvas opacity={variant === "home" ? 0.07 : 0.05} />
        </div>

        {variant === "home" ? (
          <div className="curtain__mark">
            <HomeMark />
            <span className="curtain__caption">{label}</span>
          </div>
        ) : (
          <div className="curtain__travel">
            <span className="curtain__caption">{label}</span>
            <span className="curtain__bar" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The Barberhome wordmark, drawn rather than typeset, so the stroke can be
 * animated with `stroke-dashoffset` and the mark is identical to the one in
 * the OG card and the app icon.
 */
function HomeMark() {
  return (
    <svg
      className="curtain__wordmark"
      viewBox="-8 -8 1026 116"
      fill="none"
      stroke="currentColor"
      strokeWidth="11"
      strokeLinecap="square"
      aria-hidden="true"
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
