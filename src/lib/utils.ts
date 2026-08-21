/** Tiny class joiner. No dependency needed for what one line does. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Runs `cb` after `ms`, whichever of setTimeout or requestAnimationFrame gets
 * there first.
 *
 * rAF alone is a trap: a backgrounded tab stops firing it, so any sequence
 * that waits on rAF to advance stalls, and a transition curtain that was
 * mid-close never reopens. setTimeout alone is coarse and can land before the
 * browser has painted the state we are timing. Racing them gives us paint
 * accuracy in the foreground and a guaranteed completion in the background.
 *
 * Returns a canceller.
 */
export function afterDuration(ms: number, cb: () => void): () => void {
  if (typeof window === "undefined") {
    const id = setTimeout(cb, ms);
    return () => clearTimeout(id);
  }
  let settled = false;
  let raf = 0;
  const start = performance.now();

  const finish = () => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    cb();
  };

  // The +32ms cushion lets rAF win in the normal case and makes the timeout a
  // true backstop rather than a competitor.
  const timer = setTimeout(finish, ms + 32);

  const tick = (now: number) => {
    if (now - start >= ms) finish();
    else raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    settled = true;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
  };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
