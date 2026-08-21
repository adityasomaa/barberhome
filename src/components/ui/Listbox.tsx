"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePopoverRegistration } from "../ui-state";
import { cn } from "@/lib/utils";

export type ListboxOption = { value: string; label: string; hint?: string };

type Props = {
  label: string;
  options: ListboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  id?: string;
  name?: string;
};

/**
 * A real ARIA 1.2 combobox-with-listbox, not a styled `<select>`.
 *
 * Focus stays on the trigger and the active option is tracked with
 * `aria-activedescendant`, which is what makes "focus returns to the trigger"
 * free rather than something to remember on every exit path. Keyboard support
 * is the full pattern: Up/Down, Home/End, printable-character type-ahead with a
 * one-second buffer, Enter and Space to commit, Escape to cancel, Tab to
 * commit and move on.
 *
 * A hidden input carries the value so the enclosing `<form>` submits it in a
 * plain FormData post, which is also what lets the server action validate it.
 */
export function Listbox({
  label,
  options,
  value,
  onChange,
  placeholder = "Pilih salah satu",
  invalid,
  describedBy,
  id,
  name,
}: Props) {
  const reactId = useId();
  const baseId = id ?? reactId;
  const listId = `${baseId}-list`;
  const labelId = `${baseId}-label`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ buffer: "", at: 0 });

  const selectedIndex = useMemo(
    () => options.findIndex((o) => o.value === value),
    [options, value],
  );
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    setActiveIndex(-1);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  // Registering with the shared UI state is what stops Lenis while the list is
  // open and lets the mobile menu dismiss it instead of stacking over it.
  const closeSilently = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);
  usePopoverRegistration(open, closeSilently);

  const openList = useCallback(
    (startAt?: number) => {
      setOpen(true);
      setActiveIndex(startAt ?? (selectedIndex >= 0 ? selectedIndex : 0));
    },
    [selectedIndex],
  );

  const commit = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      onChange(option.value);
      close();
    },
    [options, onChange, close],
  );

  /* Keep the active option scrolled into view without moving the page. */
  useLayoutEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  /* Outside click and viewport changes close the list. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      closeSilently();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("resize", closeSilently);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("resize", closeSilently);
    };
  }, [open, closeSilently]);

  const move = useCallback(
    (delta: number) => {
      setActiveIndex((current) => {
        const from = current < 0 ? (selectedIndex >= 0 ? selectedIndex : 0) : current;
        const next = from + delta;
        if (next < 0) return 0;
        if (next > options.length - 1) return options.length - 1;
        return next;
      });
    },
    [options.length, selectedIndex],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const key = event.key;

      if (!open) {
        if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
          event.preventDefault();
          openList(key === "ArrowUp" ? options.length - 1 : undefined);
          return;
        }
      } else {
        switch (key) {
          case "ArrowDown":
            event.preventDefault();
            move(1);
            return;
          case "ArrowUp":
            event.preventDefault();
            move(-1);
            return;
          case "Home":
            event.preventDefault();
            setActiveIndex(0);
            return;
          case "End":
            event.preventDefault();
            setActiveIndex(options.length - 1);
            return;
          case "Enter":
          case " ":
            event.preventDefault();
            commit(activeIndex);
            return;
          case "Escape":
            event.preventDefault();
            close();
            return;
          case "Tab":
            // Tab commits the highlighted option and lets focus continue, the
            // behaviour a native select has when it is open.
            if (activeIndex >= 0) onChange(options[activeIndex]!.value);
            setOpen(false);
            setActiveIndex(-1);
            return;
        }
      }

      // Type-ahead. One printable character at a time, buffered for a second so
      // "po" reaches "Potong Rambut" rather than jumping twice.
      if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const now = Date.now();
        const state = typeahead.current;
        state.buffer = now - state.at > 1000 ? key : state.buffer + key;
        state.at = now;
        const needle = state.buffer.toLowerCase();
        const from = open && activeIndex >= 0 ? activeIndex : selectedIndex;
        const ordered = [
          ...options.slice(from + 1),
          ...options.slice(0, from + 1),
        ];
        const hit = ordered.find((o) => o.label.toLowerCase().startsWith(needle));
        if (hit) {
          event.preventDefault();
          const index = options.indexOf(hit);
          if (open) setActiveIndex(index);
          else onChange(hit.value);
        }
      }
    },
    [open, activeIndex, options, selectedIndex, move, commit, close, openList, onChange],
  );

  return (
    <div className="listbox">
      <span className="field__label" id={labelId}>
        {label}
      </span>

      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        ref={triggerRef}
        type="button"
        id={baseId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelId} ${baseId}`}
        aria-activedescendant={open && activeIndex >= 0 ? `${baseId}-opt-${activeIndex}` : undefined}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className={cn("control", "listbox__trigger", invalid && "control--invalid")}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className={cn("listbox__value", !selected && "listbox__value--empty")}>
          {selected ? selected.label : placeholder}
        </span>
        <Chevron open={open} />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          className="listbox__list"
          tabIndex={-1}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${baseId}-opt-${index}`}
              role="option"
              aria-selected={option.value === value}
              data-active={index === activeIndex || undefined}
              className="listbox__option"
              // pointerdown, not click: it fires before the trigger's blur and
              // before the outside-click handler, so the selection lands.
              onPointerDown={(event) => {
                event.preventDefault();
                commit(index);
              }}
              onPointerEnter={() => setActiveIndex(index)}
            >
              <span className="listbox__option-label">{option.label}</span>
              {option.hint ? <span className="listbox__option-hint">{option.hint}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className="listbox__chevron"
      data-open={open || undefined}
      viewBox="0 0 20 20"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M5 8 L10 13 L15 8" />
    </svg>
  );
}
