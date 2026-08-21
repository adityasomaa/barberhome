"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Curtain, type CurtainState, type CurtainVariant } from "./Curtain";
import { afterDuration, prefersReducedMotion } from "@/lib/utils";
import { useUiState } from "../ui-state";

/* -- Timings ---------------------------------------------------------------
   Deliberately unhurried. The brief asks for smooth over fast, and a curtain
   that closes in 200ms reads as a flicker rather than a transition.        */
const INTRO_HOLD = 1250;
const INTRO_OPEN = 900;
const CLOSE_MS = 620;
const OPEN_MS = 760;
/** If the router has not committed by now, open anyway rather than trap the
    visitor behind a curtain that is waiting on a navigation that never lands. */
const COMMIT_TIMEOUT = 4000;

type Phase = "intro" | "idle" | "closing" | "swapping" | "opening";

type TransitionApi = {
  /** Navigate with the curtain sequence. Falls through to the router for
      anything the sequence should not own (hashes, externals, new tabs). */
  navigate: (href: string) => void;
  isNavigating: boolean;
};

const Ctx = createContext<TransitionApi | null>(null);

export function useTransitionNav(): TransitionApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTransitionNav must be used inside <TransitionProvider>");
  return ctx;
}

/**
 * Page transitions, sequenced as: page closes, content changes, scroll returns
 * to the top, page opens.
 *
 * The ordering is the whole point. `router.push` is deferred until the curtain
 * is fully closed, and `scroll: false` hands scroll restoration to us so the
 * jump to the top also happens behind the curtain. Everything the visitor
 * would otherwise see mid-swap is hidden while it happens.
 *
 * Every wait in the sequence goes through `afterDuration`, which races a
 * timeout against requestAnimationFrame. rAF alone stalls in a backgrounded
 * tab, and a sequence that stalls mid-close leaves the curtain shut forever;
 * the timeout guarantees the sequence finishes whether or not the tab is
 * being painted.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { closeMenu } = useUiState();

  const [phase, setPhase] = useState<Phase>("intro");
  const [variant, setVariant] = useState<CurtainVariant>("home");

  const pendingHref = useRef<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const lastPath = useRef(pathname);
  const reduced = useRef(false);

  const clearPending = () => {
    cancelRef.current?.();
    cancelRef.current = null;
  };

  /* -- Arrival ---------------------------------------------------------- */
  useEffect(() => {
    reduced.current = prefersReducedMotion();
    // Reduced motion still gets the loader, just without the long hold.
    const hold = reduced.current ? 120 : INTRO_HOLD;
    const cancelHold = afterDuration(hold, () => {
      setPhase("opening");
    });
    return cancelHold;
  }, []);

  /* -- Opening finishes ------------------------------------------------- */
  useEffect(() => {
    if (phase !== "opening") return;
    const duration = reduced.current ? 120 : variant === "home" ? INTRO_OPEN : OPEN_MS;
    const cancel = afterDuration(duration, () => setPhase("idle"));
    return cancel;
  }, [phase, variant]);

  /* -- Router commit ----------------------------------------------------
     `usePathname` changing is the signal that the new route's content is on
     screen. That is the moment the swap is safe to reveal, so we scroll to the
     top and start opening.                                                 */
  useEffect(() => {
    if (pathname === lastPath.current) return;
    const previous = lastPath.current;
    lastPath.current = pathname;

    window.scrollTo(0, 0);

    if (phase === "swapping") {
      clearPending();
      pendingHref.current = null;
      // The router committing a new route is exactly the external signal this
      // state machine exists to react to; advancing the phase here is the
      // point, not a cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("opening");
      return;
    }

    // Pathname moved without going through `navigate`: a browser back or
    // forward. The content has already swapped, so there is nothing left to
    // hide; play the curtain open so the change still reads as deliberate.
    if (phase === "idle" && previous !== pathname) {
      setVariant(pathname === "/" ? "home" : "page");
      setPhase("opening");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* -- Navigation ------------------------------------------------------- */
  const navigate = useCallback(
    (href: string) => {
      closeMenu();
      if (href === pathname) return;
      if (phase === "closing" || phase === "swapping") return;

      clearPending();
      pendingHref.current = href;
      setVariant(href === "/" ? "home" : "page");
      setPhase("closing");
      router.prefetch(href);

      const closeFor = reduced.current ? 140 : CLOSE_MS;
      cancelRef.current = afterDuration(closeFor, () => {
        setPhase("swapping");
        // Scroll restoration is ours: doing it here, behind a closed curtain,
        // is what keeps the swap from being visible as a jump.
        router.push(href, { scroll: false });

        // Backstop. If the route never commits we still let the visitor out.
        cancelRef.current = afterDuration(COMMIT_TIMEOUT, () => {
          pendingHref.current = null;
          window.scrollTo(0, 0);
          setPhase("opening");
        });
      });
    },
    [closeMenu, pathname, phase, router],
  );

  useEffect(() => () => clearPending(), []);

  const curtainState: CurtainState =
    phase === "intro"
      ? "closed"
      : phase === "closing"
        ? "closing"
        : phase === "swapping"
          ? "closed"
          : phase === "opening"
            ? "opening"
            : "hidden";

  const label = variant === "home" ? "Barberhome" : "Memuat halaman";

  return (
    <Ctx.Provider value={{ navigate, isNavigating: phase === "closing" || phase === "swapping" }}>
      {children}
      <Curtain variant={variant} state={curtainState} label={label} />
    </Ctx.Provider>
  );
}
