"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  rows?: number;
  columns?: number;
  className?: string;
};

/**
 * A field of short strokes that turn to follow the pointer.
 *
 * Adapted from Componentry's Magnet Lines, rewritten for this page's budget.
 * The original mounts one `useState` and one `window` mousemove listener *per
 * line*, so a 9x9 grid attaches 81 listeners and re-renders 81 React
 * components on every pointer sample. This version listens once on the
 * container, writes `transform` straight to the DOM inside a single rAF, and
 * never re-renders after mount.
 *
 * It earns its place here rather than being decoration: the strokes read as
 * the teeth of a comb, and they respond to the hand the way the tools in a
 * barbershop do. It is the one interactive flourish in the hero.
 */
export function CombLines({ rows = 7, columns = 11, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Touch surfaces have no hover; the field stays at its rest angle there.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const lines = Array.from(container.querySelectorAll<HTMLElement>("[data-line]"));
    const centres = new Float64Array(lines.length * 2);
    let raf = 0;
    let pointer = { x: 0, y: 0 };
    let active = false;

    const measure = () => {
      for (let i = 0; i < lines.length; i++) {
        const r = lines[i]!.getBoundingClientRect();
        centres[i * 2] = r.left + r.width / 2;
        centres[i * 2 + 1] = r.top + r.height / 2;
      }
    };

    const paint = () => {
      raf = 0;
      for (let i = 0; i < lines.length; i++) {
        const dx = pointer.x - centres[i * 2]!;
        const dy = pointer.y - centres[i * 2 + 1]!;
        const angle = active ? (Math.atan2(dy, dx) * 180) / Math.PI + 90 : 0;
        lines[i]!.style.transform = `rotate(${angle.toFixed(2)}deg)`;
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const onMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      active = true;
      schedule();
    };
    const onLeave = () => {
      active = false;
      schedule();
    };

    measure();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [rows, columns]);

  const total = rows * columns;

  return (
    <div
      ref={containerRef}
      className={cn("comb", className)}
      style={
        {
          "--comb-cols": columns,
          "--comb-rows": rows,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="comb__cell">
          <span data-line className="comb__line" />
        </span>
      ))}
    </div>
  );
}
