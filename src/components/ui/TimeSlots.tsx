"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  slots: string[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  invalid?: boolean;
  describedBy?: string;
  emptyMessage?: string;
};

/**
 * Time is chosen from the slots the shop actually offers, never typed.
 *
 * Implemented as an ARIA radiogroup with a roving tabindex: one Tab stop for
 * the whole group, arrow keys between slots, Home/End to the ends. Typing a
 * time into a free text field would let a visitor request 03:17 and would push
 * the entire problem onto validation.
 */
export function TimeSlots({
  label,
  slots,
  value,
  onChange,
  name,
  invalid,
  describedBy,
  emptyMessage = "Tidak ada jam tersisa pada tanggal ini. Pilih tanggal lain.",
}: Props) {
  const groupId = useId();
  const labelId = `${groupId}-label`;
  const containerRef = useRef<HTMLDivElement>(null);

  // If the selected slot disappears (the date changed, or today's slots ran
  // out) drop it rather than submit a value the picker no longer offers.
  useEffect(() => {
    if (value && !slots.includes(value)) onChange("");
  }, [slots, value, onChange]);

  const focusAt = useCallback((index: number) => {
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>("[data-slot]");
    if (!buttons?.length) return;
    const clamped = Math.max(0, Math.min(buttons.length - 1, index));
    buttons[clamped]?.focus();
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          focusAt(index + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          focusAt(index - 1);
          break;
        case "Home":
          event.preventDefault();
          focusAt(0);
          break;
        case "End":
          event.preventDefault();
          focusAt(slots.length - 1);
          break;
      }
    },
    [focusAt, slots.length],
  );

  const activeIndex = Math.max(0, slots.indexOf(value));

  return (
    <div className="field">
      <span className="field__label" id={labelId}>
        {label}
      </span>

      {name ? <input type="hidden" name={name} value={value} /> : null}

      {slots.length === 0 ? (
        <p className="slots__empty">{emptyMessage}</p>
      ) : (
        <div
          ref={containerRef}
          role="radiogroup"
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn("slots", invalid && "slots--invalid")}
        >
          {slots.map((slot, index) => {
            const checked = slot === value;
            return (
              <button
                key={slot}
                type="button"
                role="radio"
                data-slot
                aria-checked={checked}
                tabIndex={index === activeIndex ? 0 : -1}
                className="slots__chip"
                onClick={() => onChange(slot)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <span data-numeric>{slot}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
