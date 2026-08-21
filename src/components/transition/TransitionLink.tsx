"use client";

import Link from "next/link";
import { useCallback, type AnchorHTMLAttributes, type ReactNode } from "react";
import { useTransitionNav } from "./TransitionProvider";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

/**
 * Internal link that hands navigation to the curtain sequence.
 *
 * It still renders `next/link`, so prefetching, hover intent and middle-click
 * or modifier-click behaviour stay exactly as the platform expects. Only a
 * plain left click is intercepted, and only for same-origin paths.
 */
export function TransitionLink({ href, children, onClick, ...rest }: Props) {
  const { navigate } = useTransitionNav();

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      // Let the browser own anything that is not a plain left click.
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        rest.target === "_blank"
      ) {
        return;
      }
      if (!href.startsWith("/") || href.startsWith("//")) return;
      event.preventDefault();
      navigate(href);
    },
    [href, navigate, onClick, rest.target],
  );

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
