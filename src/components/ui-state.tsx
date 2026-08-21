"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type UiState = {
  /** Mobile navigation panel. */
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  /** How many popovers (calendar, listbox) are currently expanded. */
  popoverCount: number;
  /** Called by a popover on open; returns the matching close callback. */
  registerPopover: () => () => void;
  /** Anything that should suspend smooth scrolling and lock the page. */
  scrollLocked: boolean;
};

const Ctx = createContext<UiState | null>(null);

export function useUiState(): UiState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUiState must be used inside <UiStateProvider>");
  return ctx;
}

/**
 * One place that knows what is currently open.
 *
 * Everything that needs to coordinate across layers reads from here rather
 * than guessing: Lenis suspends while a popover or the menu is open, the
 * consent banner steps aside for the mobile menu instead of fighting it for
 * z-index, and the calendar closes itself when the menu takes over the screen.
 */
export function UiStateProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [popoverCount, setPopoverCount] = useState(0);
  const [closers, setClosers] = useState<Set<() => void>>(() => new Set());

  const registerPopover = useCallback(() => {
    setPopoverCount((n) => n + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      setPopoverCount((n) => Math.max(0, n - 1));
    };
  }, []);

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // The mobile menu owns the whole screen. A calendar or listbox left open
  // underneath it would keep the page locked and steal arrow keys, so opening
  // the menu closes them rather than out-stacking them.
  useEffect(() => {
    if (menuOpen) for (const close of closers) close();
  }, [menuOpen, closers]);

  const scrollLocked = menuOpen || popoverCount > 0;

  // Lock the document, preserving scroll position, while a layer is open.
  useEffect(() => {
    if (!scrollLocked) return;
    const { body } = document;
    const y = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflowY: body.style.overflowY,
    };
    // Only the full-screen menu needs the fixed-body treatment; a popover just
    // needs the page to stop moving under it.
    if (menuOpen) {
      body.style.position = "fixed";
      body.style.top = `-${y}px`;
      body.style.width = "100%";
    }
    body.style.overflowY = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflowY = prev.overflowY;
      if (menuOpen) window.scrollTo(0, y);
    };
  }, [scrollLocked, menuOpen]);

  const value = useMemo<UiState>(
    () => ({
      menuOpen,
      openMenu,
      closeMenu,
      popoverCount,
      registerPopover,
      scrollLocked,
    }),
    [menuOpen, openMenu, closeMenu, popoverCount, registerPopover, scrollLocked],
  );

  // Popovers hand us their closer so the menu can dismiss them.
  const withRegistry = useMemo(
    () => ({ ...value, __setClosers: setClosers }),
    [value],
  );

  return <Ctx.Provider value={withRegistry}>{children}</Ctx.Provider>;
}

/**
 * Registers a popover with the shared UI state for as long as `open` is true,
 * and gives the mobile menu a way to dismiss it.
 */
export function usePopoverRegistration(open: boolean, close: () => void) {
  const { registerPopover } = useUiState();
  const ctx = useContext(Ctx) as (UiState & {
    __setClosers?: (fn: (s: Set<() => void>) => Set<() => void>) => void;
  }) | null;

  useEffect(() => {
    if (!open) return;
    const release = registerPopover();
    ctx?.__setClosers?.((prev) => {
      const next = new Set(prev);
      next.add(close);
      return next;
    });
    return () => {
      release();
      ctx?.__setClosers?.((prev) => {
        const next = new Set(prev);
        next.delete(close);
        return next;
      });
    };
    // `close` is expected to be a stable useCallback from the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, close, registerPopover]);
}
