"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
};

/**
 * Scroll reveal.
 *
 * Three deliberate choices:
 *
 *  - the server-rendered state is *visible*. The shifted state is only ever
 *    applied on the client, by the same effect that arranges to remove it. If
 *    JavaScript never runs, or the observer never fires, the content is still
 *    readable rather than permanently invisible.
 *  - the revealed flag is a DOM attribute, not React state. Nothing else reads
 *    it, so round-tripping it through a render is work for no one.
 *  - the observed node must not sit inside an `overflow: hidden` ancestor. A
 *    clipped ancestor pins every intersection ratio at zero, the callback never
 *    reports `isIntersecting`, and the reveal never runs. Sections here clip on
 *    the root only; decorative clipping is applied to sibling layers instead.
 */
export function Reveal({ children, as, delay = 0, className }: Props) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.dataset.revealed = "true";
      return;
    }

    node.dataset.revealed = "false";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "true";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn("reveal", className)}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
