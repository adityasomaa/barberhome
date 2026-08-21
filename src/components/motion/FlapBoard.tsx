"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

export type FlapRow = { label: string; value: string };

const CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:+-/()";

type Props = {
  rows: FlapRow[];
  /** Overrides the content-derived width. Rarely needed. */
  columns?: number;
  className?: string;
  /** Announced once, in place of the individual cells. */
  summary: string;
};

/** Never narrower than this, so a short board still reads as a board. */
const MIN_COLUMNS = 16;
/** Never wider than this; past it the board stops fitting a phone even with
    horizontal scroll, and the longest real value fits well inside. */
const MAX_COLUMNS = 26;

/**
 * A split-flap board, the way a shop displays what is next.
 *
 * Adapted from Componentry's Split Flap Display. Three things changed. The
 * original keeps three pieces of React state plus a timeout chain in *every*
 * cell, which for a three-row board is a few hundred state updates a second;
 * this version runs one interval for the whole board and writes characters
 * straight to the cell nodes. The original sets a monospace stack, which here
 * would be a costume for "technical" on a page that has its own voice, so the
 * cells use the site face with tabular figures. And the whole board is
 * `aria-hidden` behind a single spoken summary, because a screen reader
 * announcing a flap board character by character is unusable.
 *
 * It is used once, on the booking confirmation, where the mechanical settle is
 * doing a job: it is the moment the request becomes a legible ticket.
 */
export function FlapBoard({ rows, columns, className, summary }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);

  // Width comes from the content, not a fixed guess. A hard column count
  // silently truncates whichever value happens to be longest, and on this
  // board every value is something the visitor is meant to check.
  const cols = useMemo(() => {
    if (columns) return columns;
    const longest = rows.reduce((max, r) => Math.max(max, r.value.length), 0);
    return Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, longest));
  }, [rows, columns]);

  const signature = useMemo(
    () => `${cols}|${rows.map((r) => `${r.label}=${r.value}`).join("|")}`,
    [rows, cols],
  );

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const cells = Array.from(board.querySelectorAll<HTMLElement>("[data-cell]"));
    if (!cells.length) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Each cell starts a fixed run of characters before its target rather
    // than at the top of the charset. The settle still reads as mechanical,
    // but the whole board lands in well under a second instead of grinding
    // through forty-odd frames per cell.
    const RUN = 12;
    const state = cells.map((cell) => {
      const target = (cell.dataset.target ?? " ").toUpperCase();
      const targetIndex = Math.max(0, CHARSET.indexOf(target));
      return {
        node: cell,
        target,
        index: (targetIndex - RUN + CHARSET.length) % CHARSET.length,
        start: Number(cell.dataset.delay ?? 0),
      };
    });

    if (reduce) {
      for (const s of state) s.node.textContent = s.target === " " ? " " : s.target;
      return;
    }

    for (const s of state) s.node.textContent = " ";

    let elapsed = 0;
    const STEP = 42;
    const timer = window.setInterval(() => {
      elapsed += STEP;
      let settled = 0;
      for (const s of state) {
        const current = CHARSET[s.index] ?? " ";
        if (current === s.target) {
          settled++;
          continue;
        }
        if (elapsed < s.start) continue;
        s.index = (s.index + 1) % CHARSET.length;
        const next = CHARSET[s.index] ?? " ";
        s.node.textContent = next === " " ? " " : next;
        s.node.dataset.flipping = "1";
        window.setTimeout(() => delete s.node.dataset.flipping, STEP * 0.7);
      }
      if (settled === state.length) window.clearInterval(timer);
    }, STEP);

    return () => window.clearInterval(timer);
    // Keyed on the rendered content, not on the `rows` array identity: a fresh
    // array on every parent render would restart the board mid-settle.
  }, [signature]);

  return (
    <div className={cn("flap", className)}>
      <p className="vh">{summary}</p>
      <div ref={boardRef} aria-hidden="true">
        {rows.map((row, rowIndex) => {
          const value = row.value.toUpperCase().slice(0, cols).padEnd(cols, " ");
          return (
            <div className="flap__row" key={row.label}>
              <span className="flap__label">{row.label}</span>
              <span className="flap__cells">
                {Array.from(value).map((char, i) => (
                  <span
                    key={i}
                    data-cell
                    data-target={CHARSET.includes(char) ? char : " "}
                    data-delay={rowIndex * 140 + i * 26}
                    className="flap__cell"
                  />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
