import { Fragment } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
  /** Milliseconds between each letter entering. */
  stagger?: number;
  /** Delay before the first letter enters. */
  delay?: number;
  as?: "span" | "h1" | "h2";
};

/**
 * Per-letter headline reveal.
 *
 * Adapted from Componentry's Letter Cascade. The original drives every glyph
 * through framer-motion springs; here the cascade is a CSS keyframe with a
 * per-letter `animation-delay`, because this component renders the hero
 * headline and therefore the page's LCP element. Mounting a motion tree to
 * reveal it would push the largest paint behind hydration for no visible gain,
 * and the animation is a one-shot entrance that CSS expresses exactly.
 *
 * Accessibility, which the original leaves to the caller: the whole phrase is
 * announced once from `aria-label` on the wrapper, and every individual glyph
 * is `aria-hidden`. Without that, a screen reader reads the headline out one
 * letter at a time.
 */
export function LetterCascade({
  text,
  className,
  stagger = 26,
  delay = 0,
  as: Tag = "span",
}: Props) {
  const words = text.split(" ");
  let index = 0;

  return (
    <Tag className={cn("cascade", className)} aria-label={text}>
      {words.map((word, wordIndex) => (
        <Fragment key={`${word}-${wordIndex}`}>
          <span className="cascade__word" aria-hidden="true">
            {Array.from(word).map((char, charIndex) => {
              const ms = delay + index * stagger;
              index += 1;
              return (
                <span
                  key={`${char}-${charIndex}`}
                  className="cascade__char"
                  style={{ animationDelay: `${ms}ms` }}
                >
                  {char}
                </span>
              );
            })}
          </span>
          {wordIndex < words.length - 1 ? (
            <span className="cascade__space" aria-hidden="true">
              {" "}
            </span>
          ) : null}
        </Fragment>
      ))}
    </Tag>
  );
}
