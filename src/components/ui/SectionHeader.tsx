import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TransitionLink } from "../transition/TransitionLink";

type Props = {
  /** Part 1: the section's own name. */
  eyebrow: string;
  /** Part 2: the headline. */
  headline: ReactNode;
  /** Part 3: one short neutral paragraph. */
  description: string;
  /** Part 4: the call to action. Either supply a node or an href plus label. */
  cta?: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
  /** `h1` on the page's leading section, `h2` everywhere else. */
  as?: "h1" | "h2";
  align?: "start" | "center";
  id?: string;
  className?: string;
};

/**
 * The section header, used by every section on the site.
 *
 * The brief fixes the anatomy: section name, headline, short description, call
 * to action, always in that order. Owning it in one component is what makes
 * that promise hold as pages get added, rather than being something each new
 * section has to remember.
 */
export function SectionHeader({
  eyebrow,
  headline,
  description,
  cta,
  ctaHref,
  ctaLabel,
  as: Heading = "h2",
  align = "start",
  id,
  className,
}: Props) {
  return (
    <header className={cn("section-header", `section-header--${align}`, className)}>
      <p className="section-header__eyebrow">{eyebrow}</p>
      <Heading id={id} className="section-header__headline">
        {headline}
      </Heading>
      <p className="section-header__description">{description}</p>
      <div className="section-header__cta">
        {cta ??
          (ctaHref && ctaLabel ? (
            <TransitionLink href={ctaHref} className="btn btn--primary">
              {ctaLabel}
            </TransitionLink>
          ) : null)}
      </div>
    </header>
  );
}
