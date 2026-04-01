/** Persists Medi-Support AYUSH voice consultation transcripts (client-only). */

export const AYUSH_CONSULTATION_HISTORY_KEY = "ayush-consultation-history";
export const AYUSH_ACTIVE_SESSION_KEY = "ayush-active-session";

export type ConsultationHistoryEntry = {
  id: string;
  messages: unknown[];
  date: number;
};

export type ActiveSessionData = {
  id: string;
  messages: unknown[];
  stage: string;
  preferredLanguage: string | null;
  sessionId: string | null;
  conversationContext: Record<string, unknown>;
  date: number;
};

export function readConsultationHistoryFromStorage(): ConsultationHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AYUSH_CONSULTATION_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ConsultationHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function writeConsultationHistoryToStorage(entries: ConsultationHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AYUSH_CONSULTATION_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // quota / private mode
  }
}

export function saveActiveSession(session: ActiveSessionData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AYUSH_ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch {
    // quota / private mode
  }
}

export function getActiveSession(): ActiveSessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AYUSH_ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return parsed as ActiveSessionData;
  } catch {
    return null;
  }
}

export function clearActiveSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AYUSH_ACTIVE_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Full `localStorage.clear()` wipes patient consultation history. Call this instead
 * when signing in/out so AYUSH transcripts survive auth flows.
 */
export function clearLocalStoragePreservingConsultationHistory() {
  if (typeof window === "undefined") return;
  try {
    const backup = localStorage.getItem(AYUSH_CONSULTATION_HISTORY_KEY);
    const activeSessionBackup = localStorage.getItem(AYUSH_ACTIVE_SESSION_KEY);
    localStorage.clear();
    if (backup !== null) {
      localStorage.setItem(AYUSH_CONSULTATION_HISTORY_KEY, backup);
    }
    if (activeSessionBackup !== null) {
      localStorage.setItem(AYUSH_ACTIVE_SESSION_KEY, activeSessionBackup);
    }
  } catch {
    // ignore
  }
}
