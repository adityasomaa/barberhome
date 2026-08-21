"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { useUiState } from "./ui-state";

/**
 * Smooth scrolling, desktop only.
 *
 * Lenis is switched on for pointer-precise viewports at or above 1024px and
 * nowhere else. On phones and tablets it fights the platform's own momentum
 * scrolling, breaks pull-to-refresh, and makes the calendar feel detached from
 * the finger, so those get native scrolling. It also stops entirely while the
 * menu, the calendar or a listbox is open, because a smooth-scrolled document
 * underneath an open popover is how a popover ends up floating away from its
 * trigger.
 */
export function SmoothScroll() {
  const { scrollLocked } = useUiState();
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const destroy = () => {
      cancelAnimationFrame(rafRef.current);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };

    const sync = () => {
      const wanted = media.matches && !reduce.matches;
      if (wanted && !lenisRef.current) {
        const lenis = new Lenis({
          duration: 1.05,
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
          smoothWheel: true,
          // Never claim the touch surface, even if the media query is ever
          // relaxed: this is the switch that keeps phones on native scroll.
          syncTouch: false,
          touchMultiplier: 0,
        });
        lenisRef.current = lenis;
        const loop = (time: number) => {
          lenis.raf(time);
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } else if (!wanted && lenisRef.current) {
        destroy();
      }
    };

    sync();
    media.addEventListener("change", sync);
    reduce.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
      destroy();
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (scrollLocked) lenis.stop();
    else lenis.start();
  }, [scrollLocked]);

  return null;
}
