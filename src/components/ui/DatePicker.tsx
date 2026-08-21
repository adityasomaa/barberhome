"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { usePopoverRegistration } from "../ui-state";
import { afterDuration, cn } from "@/lib/utils";
import {
  MONTHS_ID,
  WEEKDAYS_ID_SHORT,
  addDays,
  formatLongDate,
  isBeyondHorizon,
  isPastDate,
  maxSelectableIso,
  monthGrid,
  parseIso,
  todayIso,
  type IsoDate,
} from "@/lib/datetime";

/** Location and hydration are external systems, so they are read as stores. */
const subscribeToNothing = () => () => {};

type Props = {
  label: string;
  value: string;
  onChange: (iso: IsoDate) => void;
  name?: string;
  invalid?: boolean;
  describedBy?: string;
  id?: string;
};

/**
 * Calendar field.
 *
 * Three things this deliberately does not do:
 *
 *  - it is not `<input type="date">`. The native control renders a different
 *    widget on every platform, cannot be themed, and on desktop only opens
 *    from its own tiny indicator.
 *  - it does not open only from the icon. The whole field is the trigger, so a
 *    tap anywhere on it opens the calendar.
 *  - it does not render inside the form's box. The panel is portalled to
 *    `document.body` and positioned against the trigger's rect, so no
 *    ancestor's `overflow` or transform can clip it and no ancestor's stacking
 *    context can trap it below its siblings.
 *
 * Past dates are disabled here and rejected again by the server; this control
 * is a convenience, not the guard.
 */
export function DatePicker({
  label,
  value,
  onChange,
  name,
  invalid,
  describedBy,
  id,
}: Props) {
  const reactId = useId();
  const baseId = id ?? reactId;
  const panelId = `${baseId}-panel`;
  const labelId = `${baseId}-label`;

  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const today = useMemo(() => todayIso(), []);
  const maxDate = useMemo(() => maxSelectableIso(), []);

  const [cursor, setCursor] = useState<IsoDate>(value || today);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseIso(value || today);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusTarget = useRef<HTMLButtonElement | null>(null);

  // Portals need a document, so the panel only renders after hydration.
  // Read as an external store rather than mirrored into state.
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const closeSilently = useCallback(() => setOpen(false), []);
  usePopoverRegistration(open, closeSilently);

  const close = useCallback(
    (restoreFocus = true) => {
      setOpen(false);
      if (restoreFocus) triggerRef.current?.focus();
    },
    [],
  );

  const position = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const isSheet = window.matchMedia("(max-width: 639px)").matches;
    setSheet(isSheet);
    if (isSheet) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const panelWidth = Math.max(r.width, 320);
    const left = Math.min(Math.max(12, r.left), window.innerWidth - panelWidth - 12);
    const below = window.innerHeight - r.bottom;
    // Flip above the field when there is no room below it.
    const top = below < 380 && r.top > 380 ? r.top - 388 : r.bottom + 8;
    setRect({ top, left, width: panelWidth });
  }, []);

  const openPanel = useCallback(() => {
    const start = value || today;
    setCursor(start);
    const d = parseIso(start);
    setViewMonth({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
    position();
    setOpen(true);
  }, [value, today, position]);

  useLayoutEffect(() => {
    if (!open) return;
    // Measuring the trigger and storing the result is the sanctioned use of a
    // layout effect: the panel's position cannot be known before layout.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    position();
    // Reposition against scroll and resize; a portalled fixed panel does not
    // follow its trigger on its own.
    const onScroll = () => position();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, position]);

  useEffect(() => {
    if (!open) return;
    // rAF alone would never fire in a backgrounded tab, leaving the calendar
    // open with focus stranded on the trigger.
    return afterDuration(0, () => focusTarget.current?.focus());
  }, [open, cursor]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      closeSilently();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, closeSilently]);

  const disabled = useCallback(
    (iso: IsoDate) => isPastDate(iso) || isBeyondHorizon(iso),
    [],
  );

  const moveCursor = useCallback(
    (days: number) => {
      setCursor((current) => {
        const next = addDays(current, days);
        if (next < today || next > maxDate) return current;
        const d = parseIso(next);
        setViewMonth({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
        return next;
      });
    },
    [today, maxDate],
  );

  const shiftMonth = useCallback((delta: number) => {
    setViewMonth((v) => {
      const d = new Date(Date.UTC(v.year, v.month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  }, []);

  const onGridKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          moveCursor(-1);
          break;
        case "ArrowRight":
          event.preventDefault();
          moveCursor(1);
          break;
        case "ArrowUp":
          event.preventDefault();
          moveCursor(-7);
          break;
        case "ArrowDown":
          event.preventDefault();
          moveCursor(7);
          break;
        case "Home": {
          event.preventDefault();
          const weekday = (parseIso(cursor).getUTCDay() + 6) % 7;
          moveCursor(-weekday);
          break;
        }
        case "End": {
          event.preventDefault();
          const weekday = (parseIso(cursor).getUTCDay() + 6) % 7;
          moveCursor(6 - weekday);
          break;
        }
        case "PageUp":
          event.preventDefault();
          shiftMonth(-1);
          break;
        case "PageDown":
          event.preventDefault();
          shiftMonth(1);
          break;
        case "Escape":
          event.preventDefault();
          close();
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          if (!disabled(cursor)) {
            onChange(cursor);
            close();
          }
          break;
      }
    },
    [cursor, moveCursor, shiftMonth, close, disabled, onChange],
  );

  const cells = useMemo(
    () => monthGrid(viewMonth.year, viewMonth.month),
    [viewMonth],
  );

  const canGoBack = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}` >
    today.slice(0, 7);
  const canGoForward = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}` <
    maxDate.slice(0, 7);

  const panel = (
    <div
      ref={panelRef}
      id={panelId}
      role="dialog"
      aria-modal="false"
      aria-label={`${label}. Gunakan tombol panah untuk berpindah tanggal.`}
      className={cn("calendar", sheet && "calendar--sheet")}
      style={rect ? { top: rect.top, left: rect.left, width: rect.width } : undefined}
    >
      <div className="calendar__head">
        <button
          type="button"
          className="calendar__nav"
          onClick={() => shiftMonth(-1)}
          disabled={!canGoBack}
          aria-label="Bulan sebelumnya"
        >
          <Arrow direction="left" />
        </button>
        <span className="calendar__month" aria-live="polite">
          {MONTHS_ID[viewMonth.month]} {viewMonth.year}
        </span>
        <button
          type="button"
          className="calendar__nav"
          onClick={() => shiftMonth(1)}
          disabled={!canGoForward}
          aria-label="Bulan berikutnya"
        >
          <Arrow direction="right" />
        </button>
      </div>

      <div className="calendar__weekdays" aria-hidden="true">
        {WEEKDAYS_ID_SHORT.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div role="grid" className="calendar__grid" onKeyDown={onGridKeyDown}>
        {cells.map((cell) => {
          const isDisabled = disabled(cell.iso);
          const isCursor = cell.iso === cursor;
          const isSelected = cell.iso === value;
          return (
            <button
              key={cell.iso}
              ref={isCursor ? focusTarget : undefined}
              type="button"
              role="gridcell"
              tabIndex={isCursor ? 0 : -1}
              aria-selected={isSelected}
              aria-current={cell.iso === today ? "date" : undefined}
              aria-label={formatLongDate(cell.iso)}
              aria-disabled={isDisabled || undefined}
              disabled={isDisabled}
              data-outside={!cell.inMonth || undefined}
              data-today={cell.iso === today || undefined}
              className="calendar__day"
              onClick={() => {
                if (isDisabled) return;
                onChange(cell.iso);
                close();
              }}
            >
              <span data-numeric>{cell.day}</span>
            </button>
          );
        })}
      </div>

      <div className="calendar__foot">
        <button
          type="button"
          className="btn btn--quiet btn--sm"
          onClick={() => {
            onChange(today);
            close();
          }}
        >
          Hari ini
        </button>
        <button type="button" className="btn btn--quiet btn--sm" onClick={() => close()}>
          Tutup
        </button>
      </div>
    </div>
  );

  return (
    <div className="field">
      <span className="field__label" id={labelId}>
        {label}
      </span>

      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        ref={triggerRef}
        type="button"
        id={baseId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-labelledby={`${labelId} ${baseId}`}
        aria-describedby={describedBy}
        className={cn("control", "datefield", invalid && "control--invalid")}
        onClick={() => (open ? close(false) : openPanel())}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            openPanel();
          }
        }}
      >
        <span className={cn("datefield__value", !value && "datefield__value--empty")}>
          {value ? formatLongDate(value) : "Pilih tanggal"}
        </span>
        <CalendarGlyph />
      </button>

      {mounted && open
        ? createPortal(
            sheet ? (
              <div className="calendar__scrim" onPointerDown={() => close()}>
                <div onPointerDown={(e) => e.stopPropagation()}>{panel}</div>
              </div>
            ) : (
              panel
            ),
            document.body,
          )
        : null}
    </div>
  );
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" aria-hidden="true">
      {direction === "left" ? <path d="M12 4 L6 10 L12 16" /> : <path d="M8 4 L14 10 L8 16" />}
    </svg>
  );
}

function CalendarGlyph() {
  return (
    <svg className="datefield__glyph" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="2.5" y="4" width="15" height="13" />
      <path d="M2.5 8 H17.5 M6.5 2 V5.5 M13.5 2 V5.5" />
    </svg>
  );
}
