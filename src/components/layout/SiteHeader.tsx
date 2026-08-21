"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/site";
import { TransitionLink } from "../transition/TransitionLink";
import { useUiState } from "../ui-state";
import { Wordmark } from "../ui/Wordmark";
import { afterDuration, cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { menuOpen, openMenu, closeMenu } = useUiState();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* Escape closes the panel and gives focus back to the button that opened it. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        toggleRef.current?.focus();
      }
      if (event.key !== "Tab") return;
      // Focus trap. The panel covers the page, so tabbing out of it would land
      // on controls the visitor cannot see.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusable?.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    // Not a bare requestAnimationFrame: rAF does not fire in a backgrounded or
    // non-compositing tab, and focus that never lands is focus lost.
    const cancel = afterDuration(0, () =>
      panelRef.current?.querySelector<HTMLElement>("a")?.focus(),
    );
    return () => {
      window.removeEventListener("keydown", onKey);
      cancel();
    };
  }, [menuOpen, closeMenu]);

  return (
    <>
      <header className="header" data-menu-open={menuOpen || undefined}>
        <div className="header__inner shell">
          <TransitionLink href="/" className="header__brand" aria-label="Barberhome, ke beranda">
            <Wordmark className="header__wordmark" />
          </TransitionLink>

          <nav className="header__nav" aria-label="Navigasi utama">
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <TransitionLink
                    href={link.href}
                    className={cn("header__link", pathname === link.href && "header__link--current")}
                    aria-current={pathname === link.href ? "page" : undefined}
                  >
                    {link.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header__actions">
            <TransitionLink href="/reservasi" className="btn btn--primary btn--sm header__cta">
              Reservasi
            </TransitionLink>

            <button
              ref={toggleRef}
              type="button"
              className="header__toggle"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => (menuOpen ? closeMenu() : openMenu())}
            >
              <span className="vh">{menuOpen ? "Tutup menu" : "Buka menu"}</span>
              <span className="header__bars" aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        ref={panelRef}
        className="menu"
        data-open={menuOpen || undefined}
        hidden={!menuOpen}
      >
        <nav aria-label="Navigasi seluler">
          <ul className="menu__list">
            {NAV_LINKS.map((link, index) => (
              <li key={link.href} style={{ "--i": index } as React.CSSProperties}>
                <TransitionLink
                  href={link.href}
                  className={cn("menu__link", pathname === link.href && "menu__link--current")}
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="menu__foot">
          <TransitionLink href="/reservasi" className="btn btn--primary btn--wide">
            Buat reservasi
          </TransitionLink>
        </div>
      </div>
    </>
  );
}
