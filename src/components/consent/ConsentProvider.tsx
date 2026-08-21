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

const STORE_KEY = "barberhome.consent.v1";
const DRAFT_KEY = "barberhome.booking-draft.v1";
const REF_KEY = "barberhome.ref.v1";
const VISITS_KEY = "barberhome.visits.v1";

export type ConsentCategories = {
  /** Always true. Only the consent record itself is stored under it. */
  necessary: true;
  /** Remembers the booking form so a returning visitor does not retype. */
  preferences: boolean;
  /** Attaches a short per-visit reference to outgoing WhatsApp messages. */
  analytics: boolean;
};

export type ConsentRecord = ConsentCategories & { decidedAt: string };

type ConsentApi = {
  /** null until the visitor has answered, or until we have read storage. */
  consent: ConsentRecord | null;
  /** True once the client has read localStorage; avoids a hydration flash. */
  ready: boolean;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  save: (categories: Omit<ConsentCategories, "necessary">) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  /** Per-visit reference, or undefined without analytics consent. */
  ref?: string;
  /** Booking form draft, or null without preferences consent. */
  readDraft: () => Record<string, string> | null;
  writeDraft: (draft: Record<string, string>) => void;
  clearDraft: () => void;
};

const Ctx = createContext<ConsentApi | null>(null);

export function useConsent(): ConsentApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConsent must be used inside <ConsentProvider>");
  return ctx;
}

function readStore(): ConsentRecord | null {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (typeof parsed?.decidedAt !== "string") return null;
    return {
      necessary: true,
      preferences: parsed.preferences === true,
      analytics: parsed.analytics === true,
      decidedAt: parsed.decidedAt,
    };
  } catch {
    return null;
  }
}

function makeRef(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 10);
}

/**
 * Cookie consent that actually gates something.
 *
 * There is nothing here that sets a cookie for show. Each opt-in category
 * switches a real behaviour on and off, and withdrawing a category deletes
 * what it stored:
 *
 *   preferences - the booking form remembers what you typed between visits
 *   analytics   - a short random per-visit reference rides along on the
 *                 WhatsApp message so the shop can tell repeat enquiries apart
 *
 * The page-of-origin and button label on every WhatsApp link are *not* gated:
 * they are part of the message the visitor is choosing to send, not tracking.
 */
export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ref, setRef] = useState<string | undefined>(undefined);

  // localStorage is only readable after hydration. The `ready` flag is what
  // keeps the banner from flashing on a page whose visitor already answered:
  // the server cannot know the answer, so the first client render must not
  // claim to either.
  useEffect(() => {
    const stored = readStore();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(stored);
    setReady(true);
  }, []);

  // Enforce the categories on every change. This is the part that makes the
  // banner more than decoration: revoking a category erases its data now.
  useEffect(() => {
    if (!ready) return;

    if (consent?.analytics) {
      let existing = window.sessionStorage.getItem(REF_KEY);
      if (!existing) {
        existing = makeRef();
        window.sessionStorage.setItem(REF_KEY, existing);
        const visits = Number(window.localStorage.getItem(VISITS_KEY) ?? "0") + 1;
        window.localStorage.setItem(VISITS_KEY, String(visits));
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRef(existing);
    } else {
      window.sessionStorage.removeItem(REF_KEY);
      window.localStorage.removeItem(VISITS_KEY);
      setRef(undefined);
    }

    if (!consent?.preferences) {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, [consent, ready]);

  const persist = useCallback((next: Omit<ConsentCategories, "necessary">) => {
    const record: ConsentRecord = {
      necessary: true,
      preferences: next.preferences,
      analytics: next.analytics,
      decidedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(record));
    } catch {
      /* storage unavailable; the choice still applies for this session */
    }
    setConsent(record);
    setSettingsOpen(false);
  }, []);

  const readDraft = useCallback(() => {
    if (!consent?.preferences) return null;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string>) : null;
    } catch {
      return null;
    }
  }, [consent]);

  const writeDraft = useCallback(
    (draft: Record<string, string>) => {
      if (!consent?.preferences) return;
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* quota or private mode; drafts are a convenience, not a requirement */
      }
    },
    [consent],
  );

  const clearDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* nothing to do */
    }
  }, []);

  const value = useMemo<ConsentApi>(
    () => ({
      consent,
      ready,
      settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      save: persist,
      acceptAll: () => persist({ preferences: true, analytics: true }),
      rejectAll: () => persist({ preferences: false, analytics: false }),
      ref,
      readDraft,
      writeDraft,
      clearDraft,
    }),
    [consent, ready, settingsOpen, persist, ref, readDraft, writeDraft, clearDraft],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
